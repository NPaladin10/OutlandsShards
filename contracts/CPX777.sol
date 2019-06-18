pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/** Ropsten ERC777 Tokens 
 * Diamond - 0xc7a70cb917673db93053f08504e0a7ff74cdd387
 * Ruby - 0x03bcdd8051bd8ac2182892302cf9307d9bf7ad06
 * Citrine - 0x67b3d1bc921864da467d465de0e5c5ea81a53a56
 * Topaz - 0x118ccb092c331eac2a18369102db4a58e1f1a0d7
 * Emerald - 0xf715d24f6924ca326fedfb78e7b4a99d3f7305be
 * Sapphire - 0xc0464049799024f02118d8cdb8cd4b858154707c
 * Amethyst - 0x2ef8b97424b11b9a956d91657604535a29b258e7
*/

contract CPX777 is ERC777, MinterRole {
    constructor(string memory name, string memory symbol, address[] memory operators) ERC777(name, symbol, operators) public {}
    
    function mint(
        address operator,
        address account,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public {
        _mint(operator, account, amount, userData, operatorData);
    }
}
