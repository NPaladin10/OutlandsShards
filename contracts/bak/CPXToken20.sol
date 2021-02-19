// CPXToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/presets/ERC20PresetMinterPauser.sol";

/*
    Deployed 
    Goerli 0.1 - 0x1897A9F9bbE164B257A394f2C65ad0BE348c33Aa (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract CPXToken20 is ERC20PresetMinterPauser {

    constructor()
        public
        ERC20PresetMinterPauser("Cosmic", "CPX")
    {}
    
}

/*
    Deployed 
    Goerli 0.1 0x0fF715B78e0d6c92B09286bD2d3Ffa75F77b3E94 -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract CPXSimpleMinter is AccessControl {
    bool isPaused = false;
    
    //contract 
    CPXToken20 CPX20; 
    
    uint256 public MINT_PERIOD = 22 * 1 hours; 
    //cross reference 
    mapping(address => uint256) public last_mint;
    
    constructor(CPXToken20 _cpx)
        public
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        CPX20 = _cpx;
    }
    
    function paused () 
        public
        view
        returns (bool)
    {
        return isPaused;
    }
    
    /*
        admin set functions 
    */
    
    function setMintPeriod (uint256 _time) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        MINT_PERIOD = _time;
    }
    
    function pause () 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        isPaused = true;
    }
    
    function unpause () 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        isPaused = false;
    }
    
    function mint () 
        public
        returns (bool)
    {
        uint256 dT = block.timestamp - last_mint[msg.sender]; 
        require(!isPaused && !CPX20.paused(), "Cannot mint any more.");
        if(dT > MINT_PERIOD) {
            //mint 
            CPX20.mint(msg.sender, 1 ether);
            //set time 
            last_mint[msg.sender] = block.timestamp;
            //success
            return true;
        }
        return false;
    }
}