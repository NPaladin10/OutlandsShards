pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 * 
 * Ropsten
 * - 
 */

contract OutlandsHero721 is ERC721Full, MinterRole {
    using SafeMath for uint256;
    
    event NewHero (address indexed finder, uint256 indexed plane, uint256 i);
    event FundsWithdrawn (address indexed who, uint256 amt);
    //Aditional data for control of minting 
    //Cost and time
    uint256 public costToRecruit = 3 * 1 finney;
    uint256 public shareToOwner = 3 * 1 finney / 2;
    uint256 public timeBetweenRecruit = 30;
    mapping (uint256 => uint256) public nextRecruitTime;
    
    //Data for token 
    struct HeroData {
        uint256 pi;
        bytes32 hash;
    }
    mapping (uint256 => HeroData) public Heroes;

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
    constructor () public ERC721Full("Outlands Hero", "OH") {
        admin = msg.sender;
        bank = msg.sender;
        OP = ERC721Full(0xDCB77B866fE07451e8F89871EdB27b27aF9F2AFC);
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
     * @dev Internal function to determine initial hash  
     */
    function _hash(address who) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(OP.totalSupply(),who,now));
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
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @return A boolean that indicates if the operation was successful.
     */
    function minterMint(uint256 pi, address to) public onlyMinter returns (bool) {
        require(pi < OP.totalSupply());
        //mint 
        uint256 id = totalSupply();
        _mint(to, id);
        Heroes[id] = HeroData(pi, _hash(to));
        //log
        emit NewHero(to, pi, id);
        return true;
    }
    
    /**
     * @dev Conduct a search for a new plane 
     */
    function Recruit(uint256 pi) public payable {
        require(!paused);
        //must pay 
        require(msg.value >= costToRecruit);
        //can only search every so often 
        require(nextRecruitTime[pi] < now);
        //send plane owner their share
        address pOwner = OP.ownerOf(pi);
        fundsReceived[pOwner] = fundsReceived[pOwner].add(shareToOwner);
        _totalFunds = _totalFunds.add(shareToOwner);
        //update time 
        nextRecruitTime[pi] = now + timeBetweenRecruit;
        //mint 
        uint256 id = totalSupply();
        _mint(msg.sender, id);
        Heroes[id] = HeroData(pi, _hash(msg.sender));
        //log
        emit NewHero(msg.sender, pi, id);
    }
}
