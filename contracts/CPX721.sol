pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 * 
 * Ropsten
 * - Outlands Planes Registrar - 0x72ab0A4eA9E64FcFCC154d55b8777A7ad8383F65
 */

contract CPX721 is ERC721Full, MinterRole {
    uint256 public currentID;
    
    constructor (string memory name, string memory symbol) public ERC721Full(name, symbol) {}
    
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
