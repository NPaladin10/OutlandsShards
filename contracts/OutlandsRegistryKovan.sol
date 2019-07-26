pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/MinterControlToken1155.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/CosmicRegistry.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/*
    Kovan 
*/

contract OutlandsRegistry is MinterRole {
    using SafeMath for uint256;
    //events 
    event NewHero (address indexed player, uint256 i, uint256 plane);
    event NewUnit (address indexed player, uint256 i, uint256 plane, bytes32 hash);
    //link to Tokens
    MinterControlToken1155 OT;
    CosmicRegistry CPX;
    
    //mapping to determine of plane owners on main chain 
    mapping(uint256 => address) public mainChainPlaneOwners;
    //Aditional data for control of minting 
    //Cost is in Diamond 
    uint256[2] public cost = [5*1 ether,1 ether];
    uint256[2] public shareToOwner = [2 ether,(1 ether)/ 2];
    //Time 
    uint256[2] public timeBetween = [2*3600,3600];
    mapping (uint256 => uint256) public nextTimePlane;
    
    //Data for crew on plane - determines if a particular crew is claimed 
    //determined by hash of plane, day, index 
    mapping(bytes32 => bool) public crewClaimed;

    //Token type 
    uint256[2] public tokenId;
    uint256[] internal DiamondToken;
    
    address payable admin;
    //pausable 
    bool paused = false;

    //contrtuctor - set name and symbol
    constructor () public {
        admin = msg.sender;
        //set token 
        OT = MinterControlToken1155(0x20a2F9E30bdecAFfdc7B9571FF7CAC585D054014);
        CPX = CosmicRegistry(0x20a2F9E30bdecAFfdc7B9571FF7CAC585D054014);
        //push the DiamondToken id 
        DiamondToken.push(0);
    }
    
    /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
        //renounce minter 
        if(OT.isMinter(address(this))) OT.renounceMinter();
        if(CPX.isMinter(address(this))) CPX.renounceMinter();
        //destroy
        selfdestruct(admin);
    }
    
    //initiate the token 
    function init() public {
        require(msg.sender == admin && tokenId[0] == 0);
        //send the URI and it is an NFT 
        tokenId[0] = OT.create("https://outlandsplanes.appspot.com/hero/kovan/",true);
        tokenId[1] = OT.create("https://outlandsplanes.appspot.com/crew/kovan/",true);
    }
    
    /**
     * @dev Pause 
     */
    function setPaused(bool state) public {
        require(msg.sender == admin);
        paused = state;
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
    function getTokenData() public view returns (uint256[2] memory ids, uint256[2] memory count) {
        ids = tokenId;
        //loop to get count of tokens
        for(uint8 i = 0; i < 2; i++) {
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
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @return A boolean that indicates if the operation was successful.
     * planes can only be created on main chain 
     */
    function minterMint(uint256 _type, address to, uint256 plane, uint256 ci) public onlyMinter returns (bool) {
        if(_type == 2) {
            require(ci > 5 && !crewClaimed[_crewHash(plane, ci)]);
        }
        //create address [] 
        address[] memory ids = new address[](1);
        ids[0] = to;
        //mint 
        OT.mintNonFungible(tokenId[_type], ids);
        //log
        if(_type == 0) emit NewHero(to, OT.maxIndex(tokenId[_type]), plane);
        else if(_type == 1) emit NewUnit(to, OT.maxIndex(tokenId[_type]), plane, _crewHash(plane, ci));
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
     * planes can only be created on main chain 
     */
    function create(uint256 _type, uint256 plane, uint256 ci) public payable {
        bytes32 hash;
        require(!paused && _type <= 1);
        //plane must exist - must have an owner 
        require(mainChainPlaneOwners[plane] != address(0x0));
        //require index for crew  
        if(_type == 1) {
            hash = _crewHash(plane,ci);
            require(ci < 5 && !crewClaimed[hash]);
        }
        //can only create every so often 
        require(nextTimePlane[plane] < now);
        //must pay - burn Diamond 
        //create uint256[] 
        uint256[] memory _value = new uint256[](1);
        _value[0] = cost[_type];
        //has internal require to ensure player balance 
        CPX.burn(msg.sender, DiamondToken, _value);
        //mint cosmic to plane owners 
        _value[0] = shareToOwner[_type];
        //identify owner 
        address[] memory _who = new address[](1); 
        _who[0] = mainChainPlaneOwners[plane];
        CPX.mint(0, _who, _value);
        //update time 
        nextTimePlane[plane] = now.add(timeBetween[_type]);
        //create address [] - to mint 
        _who[0] = msg.sender;
        //mint 
        OT.mintNonFungible(tokenId[_type], _who);
        //log
        if(_type == 0) emit NewHero(msg.sender, OT.maxIndex(tokenId[_type]), plane);
        else if(_type == 1) emit NewUnit(msg.sender, OT.maxIndex(tokenId[_type]), plane, hash);
    }
}