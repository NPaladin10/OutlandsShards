    // ShardClaim.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CPX721.sol";
import "./CPX1155.sol";
import "./Pausable.sol";

/*
    Deployed 
*/

contract ShardClaim is PausableCPX {
    //contract link 
    CPX721 internal SHARDS;
    CPX1155 internal TOKENS;
    
    //index of color 
    uint256 internal ID_COLOR = 2;

    //track when the shard was last claimed 
    mapping (uint256 => uint256) public lastClaim;
    
    //rate of emission 
    uint256 public rate = 12 * 1 ether;
    
    //Events 
    event Claim(address indexed pleayer, uint256 id);

    //constructor
    constructor(CPX721 _shards, CPX1155 _tokens) {
        SHARDS = _shards;
        TOKENS = _tokens;
    }
    
    //set the rate 
    function setRate (uint256 _rate) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        rate = _rate;
    }
    
    //construct the random seed of an id 
    function _getSeed (uint256 id) 
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(address(SHARDS), id));
    }
    
    /*
        Claim for a shard
        This will allow anyone to claim for a shard - but the value goes to the owner 
    */
    
    function claim (uint256 id) 
        public
    {
        //pull ownership  
        address owner = SHARDS.ownerOf(id);
        
        //get the time since last claim 
        uint256 _now = block.timestamp;
        uint256 time = lastClaim[id] == 0 ? 1 days : _now - lastClaim[id];
        
        //set last claim to now 
        lastClaim[id] = _now;
        
        //get the value 
        uint256 val = rate * time / (365 * 1 days);
        
        //get the color 
        uint256 color = uint8(_getSeed(id)[ID_COLOR]) % 3; 
        
        //give the owner the claim 
        TOKENS.mint(owner, color, val * 95 / 100, "");
        //give the caller 5% 
        TOKENS.mint(msg.sender, color, val * 5 / 100, "");
        
        //emit 
        emit Claim(msg.sender, id);
    }
}