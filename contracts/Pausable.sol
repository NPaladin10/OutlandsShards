// CPXToken1155.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";

contract PausableCPX is AccessControl{
    // Create a new role identifier for the minter role
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    bool internal _isPaused = false;
    
    constructor()
        public
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
    }
    
    function paused () 
        public
        view
        returns (bool)
    {
        return _isPaused;
    }
    
    function pause () 
        public
    {
        require(hasRole(PAUSER_ROLE, msg.sender), "No permission.");
        _isPaused = true;
    }
    
    function unpause () 
        public
    {
        require(hasRole(PAUSER_ROLE, msg.sender), "No permission.");
        _isPaused = false;
    }
}