pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 * 
 * Ropsten
 * - 0x60833250E9F1c0d6Ea49086f80db75e586F7d43c
 */

contract OutlandsPlane721 is ERC721Full, MinterRole {
    event NewPlane (address indexed finder, uint256 i);
    //Aditional data for control of minting 
    //Cost and time
    uint256 public costToSearch = 1 finney;
    uint256 public timeBetweenSearches = 30;
    mapping (address => uint256) public nextSearchTime;

    //sets urls 
    string private dataURL = "https://npaladin10.github.io/OutlandsShards/shards.html?plane=";

    address payable bank;
    address admin;
    //pausable 
    bool paused = false;

    //contrtuctor - set name and symbol
    constructor () public ERC721Full("Outlands Plane", "OPR") {
        admin = msg.sender;
        bank = msg.sender;
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
     * @dev Initialize a number of planes  
     */
    function initPlanes() public {
        uint256 start = totalSupply();
        require(msg.sender == admin && start < 64);
        for(uint256 i = 0; i < 8; i++) {
            //only increasing index of ids
            _mint(admin, start+i);
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
    function setDataURL(string memory url) public {
        require(msg.sender == admin);
        dataURL = url;
    }
    
    /**
     * @dev Set cost 
     */
    function setCostToSearch(uint256 cost) public {
        require(msg.sender == admin);
        costToSearch = cost;
    }
    
    /**
     * @dev Set Time 
     */
    function setTimeBetweenSearches(uint256 time) public {
        require(msg.sender == admin);
        timeBetweenSearches = time;
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
     */
    function forcedTransferFrom(address from, address to, uint256 _tokenID) public onlyMinter {
        safeTransferFrom(from, to, _tokenID);
    }
    
    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @return A boolean that indicates if the operation was successful.
     */
    function minterMint(address to) public onlyMinter returns (bool) {
        uint256 currentID = totalSupply();
        //only increasing index of ids
        _mint(to, currentID);
        //log
        emit NewPlane(to, currentID);
        return true;
    }
    
    /**
     * @dev Conduct a search for a new plane \
     */
    function Search() public payable {
        require(!paused);
        //must pay 
        require(msg.value >= costToSearch);
        //can only search every so often 
        require(nextSearchTime[msg.sender] < now);
        //send owner balance
        bank.transfer(address(this).balance);
        //update time 
        nextSearchTime[msg.sender] = now + timeBetweenSearches;
        //mint 
        _mint(msg.sender, totalSupply());
        //log
        emit NewPlane(msg.sender, totalSupply()-1);
    }
}
