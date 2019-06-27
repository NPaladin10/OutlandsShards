pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 * 
 * Ropsten
 * - Outlands Planes Registry - 0xC6B43DfbE2acB52ee930f13a1a36E0F871F0320B
 */

contract CPX721 is ERC721Full, MinterRole {
    // Optional mapping for token URIs
    mapping(uint256 => string) internal _tokenURIs;
    
    string public baseURL = "https://npaladin10.github.io/OutlandsShards/index.html";
    uint256 public currentID;
    
    //Default operator for all tokens - token contract creator 
    address private _deafultOperator;
    
    constructor (string memory name, string memory symbol, string memory URL) public ERC721Full(name, symbol) {
        _deafultOperator = msg.sender;
        //check if url exists 
        bytes memory bURL = bytes(URL);
        if (bURL.length != 0) {
            baseURL = URL;
        }
    }
    
    /**
     * @dev Returns whether the given spender can transfer a given token ID.
     * @dev changed to accept global operator
     * @param spender address of the spender to query
     * @param tokenId uint256 ID of the token to be transferred
     * @return bool whether the msg.sender is approved for the given token ID,
     * is an operator of the owner, or is the owner of the token
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "ERC721: operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        return (_deafultOperator == spender || spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
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
     * @dev Returns an URI for a given token ID.
     * Throws if the token ID does not exist. May return an empty string.
     * @param tokenId uint256 ID of the token to query
     */
    function tokenURI(uint256 tokenId) external view returns (string memory uri) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        //check if local uri exists 
        uri = _tokenURIs[tokenId];
        bytes memory bURI = bytes(uri);
        //if it does not - build it 
        if (bURI.length == 0) {
            uri = string(abi.encodePacked(baseURL, _uint2str(tokenId)));
        }
    }
    
    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @param uri The token URI of the minted token.
     * @return A boolean that indicates if the operation was successful.
     */
    function mintWithTokenURI(address to, string memory uri) public onlyMinter returns (bool) {
        //only increasing index of ids
        _mint(to, currentID);
        _tokenURIs[currentID] = uri;
        //increment
        currentID++;
        return true;
    }
    
    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to) public onlyMinter returns (bool) {
        //only increasing index of ids
        _mint(to, currentID);
        //increment
        currentID++;
        return true;
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
     * @dev Burns a specific ERC721 token.
     * @param tokenId uint256 id of the ERC721 token to be burned.
     */
    function burn(uint256 tokenId) public {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721Burnable: caller is not owner nor approved");
        _burn(tokenId);
    }
}