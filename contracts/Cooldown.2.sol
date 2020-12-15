// CharacterForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";

/*
    Deployed 
    Goerli 0.1 - 0xfa003CEa1D28106Ea2F5aD7c8B0d2fC0267375D4 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x1F8fEC5Cbf415ad6101Dd40326aAa2076964EE33 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract Cooldown is PausableCPX {
    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    //contracts 
    Gatekeeper private GK;

    //cooldown 
    mapping (uint256 => uint256) public cooldown;
    
    //players can buy cooldown to reduce the unit cooldown
    uint256[6] private cooldownTokens = [101,102,103,104,105,106];
    uint256[6] private steps = [5 * 1 minutes, 15 * 1 minutes, 1 hours, 3 * 1 hours, 8 * 1 hours, 1 days];

    //constructor
    constructor(Gatekeeper gk)
        public
    {
        GK = gk;
    }
    
    /*
        View Functions 
    */
    
    function getCooldownTokens () 
        public
        view 
        returns (uint256[6] memory)
    {
        return cooldownTokens;
    }
    
    function getTokenSteps () 
        public
        view 
        returns (uint256[6] memory)
    {
        return steps;
    }
    
    /*
        Set Functions for Internal Variables  
    */

    function setCooldownTokens (uint256[6] calldata _tokens) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        cooldownTokens = _tokens;
    }
    
    function setCooldownSteps (uint256[6] calldata _steps) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        steps = _steps;
    }

    /*
        External Functions 
    */
    
    //External call to set the cooldown of an ID 
    function setIdCooldown (uint256 _id, uint256 _cool) 
        public
        returns (uint256)
    {
        require(!_isPaused, "The contract is paused.");
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        cooldown[_id] = _cool;
        return (cooldown[_id]);
    }
    
    function useCooldownToken (uint256 _id, uint256 _ti, uint256 _qty) 
        public
        returns (uint256)
    {
        require(!_isPaused, "The contract is paused.");
        require (_ti < cooldownTokens.length, "Incorrect token.");
        //must be greater than time
        uint256 _time = steps[_ti] * _qty;
        require(cooldown[_id] > _time, "Cooldown past time.");
        //require approval 
        address player = msg.sender;
        require(GK.balanceOf(player, cooldownTokens[_ti]) >= _qty, "You don't have the tokens.");
        
        //burn
        GK.burn(msg.sender, cooldownTokens[_ti], _qty);
        
        //reduce cooldown
        cooldown[_id] -= _time;
        
        return (cooldown[_id]);
    }
}
