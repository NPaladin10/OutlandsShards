pragma solidity ^0.5.0;

import "./ERC777.sol";
import "./MinterRole.sol";

/**
 * @dev Extension of `ERC20` that adds a set of accounts with the `MinterRole`,
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract CPXERC777 is ERC777, MinterRole {
    
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
        ) ERC777(name, symbol, defaultOperators) public {}
    
    /**
     * @dev See `ERC20._mint`.
     *
     * Requirements:
     *
     * - the caller must have the `MinterRole`.
     */
    function mint(
        address operator,
        address account,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
        ) public onlyMinter returns (bool) {
        _mint(operator, account, amount, userData, operatorData);
        return true;
    }
}
