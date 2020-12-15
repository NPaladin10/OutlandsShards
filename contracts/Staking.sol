// CPXToken1155.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./CPXToken20.sol";
import "./CPXToken1155.sol";
import "./Pausable.sol";

/*
    Deployed 
    Goerli 0.1  0x596E1E05161f994c92b356582E12Ef0fD2A86170 -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract DiamondMinter is PausableCPX {
    using SafeMath for uint256;
    
    //contract 
    CPXToken1155 CPX1155;
    CPXToken20 CPX20;
    
    uint256 internal perYear = 4;
    uint256 internal multiplier = 200;
    uint256 internal mPeriod = 90 * 1 days;
    
    struct Deposit {
        uint256 time;
        uint256 value;
        uint256 lastMint;
    }
    mapping(address => Deposit) deposits;
    uint256 private _total;
    
    //Events
    event Withdraw(address user, uint256 amount);
    event Stake(address user, uint256 amount);
    event Mint(address user, uint256 amount);
    
    //Constructor 
    constructor(CPXToken1155 _cpx1155, CPXToken20 _cpx20)
        public
    {
        CPX1155 = _cpx1155;
        CPX20 = _cpx20;
    }
    
    /*
        internal 
    */
    
    function _calculateMint (address user) 
        internal
        view
        returns (uint256 amt)
    {
        uint256 time = block.timestamp;
        Deposit memory D = deposits[user];
        //time since last mint 
        uint256 dT = time - D.lastMint;
        uint256 _m = (time - D.time) > mPeriod ? multiplier : multiplier * (time - D.time) / mPeriod;
        // deposit amt * multiplier * perYear * nYears (or fraction) 
        amt = D.value * (100 + _m) / 100 * perYear * dT / (365 * 1 days);
    }
    
    function _mint (address user)
        internal
        returns (uint256 amt)
    {
        require(!_isPaused, "Cannot mint at this time.");
        
        //get the mint amount
        amt = _calculateMint(user);

        //update mint time 
        deposits[user].lastMint = block.timestamp;

        //mint on CPX1155
        if(amt > 0) {
            CPX1155.mint(user, 1, amt, "");
            //emit 
            emit Mint(user, amt);
        } 
    }
    
    /*
        view  
    */
    
    function getTotalStaked () 
        public
        view
        returns (uint256 amt)
    {
        return _total;
    }
    
    function getMintAmount ()
        public
        view
        returns (uint256 amt)
    {
        return _calculateMint(msg.sender);
    }
    
    function getDeposit ()
        public
        view
        returns (uint256 time, uint256 value, uint256 lastMint)
    {
        Deposit memory D = deposits[msg.sender];
        return (D.time, D.value, D.lastMint);
    }
    
    function getLastMint ()
        public
        view
        returns (uint256 lastMint)
    {
        return deposits[msg.sender].lastMint;
    }
    
    /*
        external  
    */
    
    function setContracts (CPXToken1155 _cpx1155, CPXToken20 _cpx20) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        CPX1155 = _cpx1155;
        CPX20 = _cpx20;
    }
    
    function setAPY (uint256 baseAPY, uint256 _multiplier, uint256 _period) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        if(baseAPY > 0) perYear = baseAPY;
        if(_multiplier > 0) multiplier = _multiplier;
        if(_period > 0) mPeriod = _period;
    }
    
    function unstake (uint256 _amt) 
        public
    {
        address user = msg.sender;
        require (_total >= _amt, "Not enough funding.");
        require (deposits[user].value >= _amt, "You cannot withdraw more than you have.");
        
        //first call mint 
        _mint(user);
        
        //now reduce deposit value 
        deposits[user].value = deposits[user].value.sub(_amt);
        
        //transfer
        CPX20.transfer(user, _amt);
        
        //decrease local balance 
        _total = _total.sub(_amt);
        
        //emit 
        emit Withdraw(user, _amt);
    }
    
    function stake (uint256 _amt)
        public
    {
        address user = msg.sender;
        require(!_isPaused, "Cannot stake at this time.");
        uint256 allowance = CPX20.allowance(user, address(this));
        require(allowance >= _amt, "Please increase your allowance.");
        uint256 balance = CPX20.balanceOf(user);
        require(balance >= _amt, "Not enough balance.");
        
        //transfer
        CPX20.transferFrom(user, address(this), _amt);
        
        //increase local balance 
        _total = _total.add(_amt);
        
        //mint what is there to set mint time 
        _mint(user);
        
        //deposit - adjust time value for staking 
        uint256 _now = block.timestamp;
        uint256 dT = _now - deposits[user].time;
        uint256 totalVal = deposits[user].value.add(_amt);
        uint256 timeAdjust = dT * _amt / totalVal;
        
        deposits[user].time += timeAdjust; 
        deposits[user].value = totalVal;
        
        //emit 
        emit Stake(user, _amt);
    }
    
    function mint () 
        public
        returns (uint256 amt)
    {
        return _mint(msg.sender);        
    }
}