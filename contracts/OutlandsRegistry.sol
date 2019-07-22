pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsTokens1155.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/*
    Ropsten - 0x6D6EF96EFD4E354d63682cBC165f8ddB1cA52dC7
*/

contract OutlandsRegistry is MinterRole {
    using SafeMath for uint256;
    //events 
    event NewPlane (address indexed player, uint256 i);
    event NewHero (address indexed player, uint256 i, uint256 plane);
    event NewUnit (address indexed player, uint256 i, uint256 plane, bytes32 hash);
    event FundsWithdrawn (address indexed who, uint256 amt);
    //link to Tokens
    OutlandsToken1155 OT;
    //Aditional data for control of minting 
    //Cost and time
    uint256[3] public cost = [10*1 finney,3*1 finney,1 finney];
    uint256[3] public shareToOwner = [0,1 finney,(1 finney)/ 2];
    uint256[3] public timeBetween = [4*3600,2*3600,3600];
    mapping (address => uint256) public nextTimePlayer;
    mapping (uint256 => uint256) public nextTimePlane;
    
    //Data for crew on plane - determines if a particular crew is claimed 
    //determined by hash of plane, day, index 
    mapping(bytes32 => bool) public crewClaimed;

    //Token type 
    uint256[3] public tokenId;
    
    //Store funds
    uint256 _totalFunds;
    mapping (address => uint256) public fundsReceived;

    address payable bank;
    address admin;
    //pausable 
    bool paused = false;

    //contrtuctor - set name and symbol
    constructor () public {
        admin = msg.sender;
        bank = msg.sender;
        //set token 
        OT = OutlandsToken1155(0x20a2F9E30bdecAFfdc7B9571FF7CAC585D054014);
    }
    
    /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
        //renounce  minter
        OT.renounceMinter();
        //destroy
        selfdestruct(bank);
    }
    
    //initiate the token 
    function init() public {
        require(msg.sender == admin && tokenId[0] == 0);
        //send the URI and it is an NFT 
        tokenId[0] = OT.create("https://outlandsplanes.appspot.com/plane/",true);
        tokenId[1] = OT.create("https://outlandsplanes.appspot.com/hero/",true);
        tokenId[2] = OT.create("https://outlandsplanes.appspot.com/crew/",true);
    }
    
    /**
     * @dev Initialize a number of planes  
     */
    function initPlanes() public {
        uint256 current = OT.maxIndex(tokenId[0]);
        require(msg.sender == admin && current < 64);
        //create address [] 
        address[] memory ids = new address[](1);
        ids[0] = admin;
        //now create 16 new planes 
        for(uint256 i = 0; i < 16; i++) {
            OT.mintNonFungible(tokenId[0], ids);
        }
    }
    
    /**
     * @dev Pause 
     */
    function setPaused(bool state) public {
        require(msg.sender == admin);
        paused = state;
    }
    
    /**
     * @dev Set Bank 
     */
    function setBank(address payable _bank) public {
        require(msg.sender == admin);
        bank = _bank;
    }
    
    /**
     * @dev Set url/uri 
     */
    function setURI(uint256 _type, string memory uri) public {
        require(msg.sender == admin);
        OT.setURI(tokenId[_type], uri);
    }
    
    /**
     * @dev Set cost 
     */
    function setCost(uint256 _type, uint256 _cost) public {
        require(msg.sender == admin);
        cost[_type] = _cost;
    }
    
    /**
     * @dev Set Time 
     */
    function setTimeBetween(uint256 _type, uint256 time) public {
        require(msg.sender == admin);
        timeBetween[_type] = time;
    }
    
    //get all the token data 
    function getTokenData() public view returns (uint256[3] memory ids, uint256[3] memory count) {
        ids = tokenId;
        //loop to get count of tokens
        for(uint8 i = 0; i < 3; i++) {
            count[i] = OT.maxIndex(tokenId[i]);
        }
    }
    
    //get the owner of an Array of tokens 
    function ownerOfBatch(uint256[] memory ids) public view returns (address[] memory owners) {
        require(ids.length < 32);
        //set length 
        uint256 l = ids.length;
        owners = new address[](l);
        for(uint256 i = 0; i < l; i++) {
            owners[i] = OT.ownerOf(ids[i]);
        }
    }
    
    //get the owner of a particular token based upon index  
    function ownerOfByIndex(uint256 _type, uint256 index) public view returns (address) {
        uint256 id  = tokenId[_type] | index;
        return OT.ownerOf(id);
    } 
    
    /**
     * @dev Withdraw balance to bank
     */
    function withdrawToBank() public {
        require(msg.sender == admin || msg.sender == bank);
        //get the balance of contract minus what is allocated to users
        uint256 funds = address(this).balance.sub(_totalFunds);
        //withdraw 
        bank.transfer(funds);
        //emit 
        emit FundsWithdrawn(bank, funds);
    }
    
    /**
     * @dev Withdraw balance if funds have been received
     */
    function withdrawFundsReceived() public {
        uint256 funds = fundsReceived[msg.sender];
        //capture no funds 
        if(funds == 0) {
            return;
        }
        else {
            //subtract   
            fundsReceived[msg.sender] = fundsReceived[msg.sender].sub(funds);
            _totalFunds = _totalFunds.sub(funds);
            //pay 
            msg.sender.transfer(funds);
            //emit 
            emit FundsWithdrawn(msg.sender, funds);
        }
    }
    
    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @return A boolean that indicates if the operation was successful.
     */
    function minterMint(uint256 _type, address to, uint256 plane, uint256 ci) public onlyMinter returns (bool) {
        if(_type > 0) {
            require(OT.getNonFungibleBaseType(plane) == tokenId[0]);
        }
        if(_type == 2) {
            require(ci > 5 && !crewClaimed[_crewHash(plane, ci)]);
        }
        //create address [] 
        address[] memory ids = new address[](1);
        ids[0] = to;
        //mint 
        OT.mintNonFungible(tokenId[_type], ids);
        //log
        if(_type == 0) emit NewPlane(to, OT.maxIndex(tokenId[_type]));
        else if(_type == 1) emit NewHero(to, OT.maxIndex(tokenId[_type]), plane);
        else if(_type == 2) emit NewUnit(to, OT.maxIndex(tokenId[_type]), plane, _crewHash(plane, ci));
        return true;
    }
    
    //Quick lookup of the current day 
    function day() public view returns(uint256) {
        return now/(24*60*60);
    }
    
    //Check which crew remains 
    function getClaimedCrew(uint256 plane) public view returns(bool[5] memory isClaimed) {
        for(uint256 i = 0; i < 5; i++){
            isClaimed[i] = crewClaimed[_crewHash(plane, i)];
        }
    }
    
    //hash function for Crew 
    function _crewHash(uint256 plane, uint256 i) internal view returns(bytes32) {
        return keccak256(abi.encodePacked(day(),plane,i));
    }
    
    /**
     * @dev Create a new Plane / Hero / Uint 
     */
    function create(uint256 _type, uint256 plane, uint256 ci) public payable {
        address _owner = bank;
        bytes32 hash;
        require(!paused && _type <= 2);
        //plane must exist - must be of type of plane 
        if(_type > 0) {
            require(OT.getNonFungibleBaseType(plane) == tokenId[0]);
            //require index 
            if(_type == 2) {
                hash = _crewHash(plane,ci);
                require(ci < 5 && !crewClaimed[hash]);
            }
            //identify owner 
            _owner = OT.ownerOf(plane);
        }
        //must pay 
        require(msg.value >= cost[_type]);
        //can only create every so often 
        require(_type == 0 ? nextTimePlayer[msg.sender] < now : nextTimePlane[plane] < now);
        //update funds received 
        if(_type > 0) {
            fundsReceived[_owner] = fundsReceived[_owner].add(shareToOwner[_type]);
            _totalFunds = _totalFunds.add(shareToOwner[_type]);
            //update time 
            nextTimePlane[plane] = now.add(timeBetween[_type]);
            //claim hash 
            if(_type == 2) crewClaimed[hash] = true;
        }
        else {
            nextTimePlayer[msg.sender] = now.add(timeBetween[0]);
        }
        //create address [] - to mint 
        address[] memory ids = new address[](1);
        ids[0] = msg.sender;
        //mint 
        OT.mintNonFungible(tokenId[_type], ids);
        //log
        if(_type == 0) emit NewPlane(msg.sender, OT.maxIndex(tokenId[_type]));
        else if(_type == 1) emit NewHero(msg.sender, OT.maxIndex(tokenId[_type]), plane);
        else if(_type == 2) emit NewUnit(msg.sender, OT.maxIndex(tokenId[_type]), plane, hash);
    }
}