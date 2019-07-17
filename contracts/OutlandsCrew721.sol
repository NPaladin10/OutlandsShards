pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 * 
 * Ropsten
 * - 0x124100394DA21da560722F9E9E895a2E72bfB170
 */

contract OutlandsCrew721 is ERC721Full, MinterRole {
    using SafeMath for uint256;
    
    event NewCrew (address indexed finder, uint256 id, uint256 indexed plane, uint256 i);
    event FundsWithdrawn (address indexed who, uint256 amt);
    //Aditional data for control of minting 
    //Cost and time
    uint256 public costToRecruit = 1 finney;
    uint256 public shareToOwner = 1 finney / 2;
    uint256 public timeBetweenRecruit = 3600;
    mapping (uint256 => uint256) public nextRecruitTime;
    
    //Data for token - plane, index of crew on plane 
    mapping (uint256 => uint256[2]) internal crewData;
    mapping (uint256 => uint256) public planeCrewIndex;
    mapping (uint256 => mapping(uint256 => bool)) public crewClaimed;

    //sets urls 
    string private dataURL = "https://npaladin10.github.io/OutlandsShards/index.html?hero=";

    address payable bank;
    address admin;
    //pausable 
    bool paused = false;
    
    //Store funds
    uint256 _totalFunds;
    mapping (address => uint256) public fundsReceived;
    
    //link to other contract 
    ERC721Full OP;

    //contrtuctor - set name and symbol
    constructor () public ERC721Full("Outlands Crew", "OC") {
        admin = msg.sender;
        bank = msg.sender;
        OP = ERC721Full(0xa8Af2e26488a02A4653687f71EFA212a2001e7a2);
    }
    
    /**
     * @dev Internal function to turn a number into a string 
     * @param _i uint256 
     */
    function _uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
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
    function setDataURL(string memory url) public {
        require(msg.sender == admin);
        dataURL = url;
    }
    
    /**
     * @dev Set cost 
     */
    function setCostToRecruit(uint256 cost) public {
        require(msg.sender == admin);
        costToRecruit = cost;
    }
    /**
     * @dev Set share 
     */
    function setShare(uint256 share) public {
        require(msg.sender == admin);
        shareToOwner = share;
    }
    
    /**
     * @dev Set Time 
     */
    function setTimeBetweenRecruit(uint256 time) public {
        require(msg.sender == admin);
        timeBetweenRecruit = time;
    }
    
    /**
     * @dev Returns an URI for a given token ID.
     * Throws if the token ID does not exist. May return an empty string.
     * @param tokenId uint256 ID of the token to query
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked(dataURL, _uint2str(tokenId)));
    }
    
    /**
     * @dev Check if Token exists .
     * @param tokenId uint256 id of the ERC721 token.
     */
    function tokenExists(uint256 tokenId) public view returns(bool) {
        return _exists(tokenId);
    }
    
    /**
     * @dev Get array of owned tokens.
     * @param owner of the ERC721 token.
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _tokensOfOwner(owner);
    }
    
    /**
     * @dev Forced transfer from one to another 
     * No burn allowed
     */
    function forcedTransferFrom(address from, address to, uint256 _tokenId) public onlyMinter {
        //make a forced transfer 
        _transferFrom(from, to, _tokenId);
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
     * @dev View Plane Contract address   
     */
    function getPlanesContract() public view returns(address) {
        return address(OP);
    }
    
    /**
     * @dev Check which crew indexes remain based upon current index   
     */
    function getRemainingCrew(uint256 plane) public view returns(bool[7] memory exists) {
        uint256 j = planeCrewIndex[plane];
        for(uint8 i = 0; i < 7; i++) {
            j = j + i;
            exists[i] = !crewClaimed[plane][j];
        }
    }
    
    /**
     * @dev View Crew Data  
     */
    function getCrewData(uint256 id) public view returns(address, uint256[2] memory) {
        require(_exists(id), "ERC721Metadata: query for nonexistent token");
        return (ownerOf(id), crewData[id]);
    }
    
    /**
     * @dev Internal Claim 
     * Claims crew, sets data, and increases index as necessary
     */
    function _claim(uint256 id, uint256 plane, uint256 i) internal {
        //claim 
        crewClaimed[plane][i] = true;
        //set data
        crewData[id] = [plane,i];
        //increase index if needed
        if(planeCrewIndex[plane] == i) {
            planeCrewIndex[plane]++;
        }
    }
    
    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @return A boolean that indicates if the operation was successful.
     */
    function minterMint(uint256 plane, uint256 i, address to) public onlyMinter returns (bool) {
        require(plane < OP.totalSupply() && !crewClaimed[plane][i]);
        //mint 
        uint256 id = totalSupply();
        _mint(to, id);
        //claim 
        _claim(id,plane,i);
        //log
        emit NewCrew(to, id, plane, i);
        return true;
    }
    
    /**
     * @dev Conduct a search for a new plane 
     */
    function Recruit(uint256 plane, uint256 i) public payable {
        require(!paused && plane < OP.totalSupply() && i < planeCrewIndex[plane]+5);
        require(!crewClaimed[plane][i]);
        //must pay 
        require(msg.value >= costToRecruit);
        //can only search every so often 
        require(nextRecruitTime[plane] < now);
        //send plane owner their share
        address pOwner = OP.ownerOf(plane);
        fundsReceived[pOwner] = fundsReceived[pOwner].add(shareToOwner);
        _totalFunds = _totalFunds.add(shareToOwner);
        //update time 
        nextRecruitTime[plane] = now + timeBetweenRecruit;
        //mint 
        uint256 id = totalSupply();
        _mint(msg.sender, id);
        //claim 
        _claim(id,plane,i);
        //log
        emit NewCrew(msg.sender, id, plane, i);
    }
    
    /**
     * @dev Increase the index without purchasing 
    */
    function increaseIndex(uint256 plane) public payable {
        //not paused, pay cost, and plane is in bounds
        require(!paused && msg.value >= costToRecruit / 5 && plane < OP.totalSupply());
        //increase index 
        uint256 i = planeCrewIndex[plane];
        crewClaimed[plane][i] = true;
        planeCrewIndex[plane]++;
    }
}
