pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/IERC721Enumerable.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */

contract ICPX721 is IERC721Enumerable, MinterRole {
    /**
     * Metadata 
     */
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    
    /**
     * Mintable 
     */
    function currentID() external returns (uint256);
    function mint(address to) public returns (bool);
    
    /**
     * Burnable 
     */
    function burn(uint256 tokenId) public;
}
