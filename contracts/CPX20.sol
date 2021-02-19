// CPX20.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/presets/ERC20PresetMinterPauser.sol";

/*
    Deployed 
    Goerli - 
*/
contract CPX20 is ERC20PresetMinterPauser {
 
    constructor(string memory name, string memory symbol)
        ERC20PresetMinterPauser(name, symbol)
    {}
}