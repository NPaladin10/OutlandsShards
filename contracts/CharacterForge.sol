// CharacterForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ShardForge.sol";
import "./Cooldown.sol";

/*
    Deployed 
    local 0.2 - 0x1b9aCd0c1C972Ed4dB743c5e55797d2251fD38CB
    local 0.3 - 0x99aB2d91CF69021d51d69b465182F7Da95EaF0db
    Goerli 0.1 - 0x6Ca442A4F8bAEfAc47e9710641b7F4d6B65Ee8c3 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0xf9b9c3b712334AA91CeAa47bC37202Bb863FddEe (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    
*/
contract CharacterLocation is PausableCPX {
    // Create a new role identifier for the minter role
    bytes32 public constant MOVER_ROLE = keccak256("MOVER_ROLE");
    bytes32 public constant COOL_ROLE = keccak256("COOL_ROLE");
    
    //contracts 
    OutlandsShards internal OS; 
    Gatekeeper internal GK;
    Cooldown internal Cool;

    //location - characetr => shard id  
    mapping (uint256 => bytes32) public shardLocation;
    
    //Events 
    event Move(uint256 id, bytes32 shard);
    
    //constructor
    constructor(Gatekeeper gk, OutlandsShards os, Cooldown cool)
        public
    {
        GK = gk;
        OS = os;
        Cool = cool;
    }
    
    /*
        Internal Functions 
    */
    
    function _move (uint256 id, bytes32 toShard)
        internal
    {
        require(!_isPaused, "The contract is paused.");

        //cooldown time
        uint256 _time = block.timestamp + OS.getTravelTime(shardLocation[id], toShard);

        //set cooldown
        Cool.setIdCooldown(id, _time);
        
        //set location
        shardLocation[id] = toShard;
        
        //emit 
        emit Move(id, toShard);
    }
    
    /*
        External Admin Functions 
    */
    
    function setContracts (Gatekeeper gk, OutlandsShards os, Cooldown cool)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        GK = gk;
        OS = os;
        Cool = cool;
    }
    
    //External call for other contracts to move character 
    function moveFor (uint256 id, bytes32 toShard, bool useCooldown) 
        public
    {
        require(hasRole(MOVER_ROLE, msg.sender), "Caller is not authorized.");
        
        if(useCooldown) {
            _move(id, toShard);
        }
        else {
            //set location
            shardLocation[id] = toShard;
            
            //emit 
            emit Move(id, toShard);
        }
    }
    
    /*
        Set cool through this contract 
    */
    function setCooldown (uint256 id, uint256 cool) 
        public 
    {
        require(hasRole(COOL_ROLE, msg.sender), "Caller is not authorized.");
        
        //set cooldown
        Cool.setIdCooldown(id, cool);
    }
    
    /*
        Extermal data calls 
    */
    
    //gets the shard information where the character id is located 
    function getShardData (uint256 _id) 
        public
        view 
        returns (bytes32 seed, uint256 r, uint8 a, uint256 rare, uint256 id)
    {
        seed = shardLocation[_id];
        (id, r, a, rare) = OS.getShardBySeed(seed); 
    }
    
    //look for owner 
    function isOwnerOf (address player, uint256 id) 
        public
        view
        returns (bool)
    {
        return GK.balanceOf(player, id) == 1; 
    }
    
    //get the cooldown of the character
    function getCooldown (uint256 id) 
        public
        view 
        returns (uint256)
    {
        return Cool.cooldown(id);
    }
    
    /*
        Functions for players to initialize and move their character 
    */
    
    function init (uint256 id, bytes32 seed) 
        public
    {
        require(!_isPaused, "The contract is paused.");
        require(shardLocation[id] == bytes32(0), "Location is already set.");
        //check for ownership 
        require(isOwnerOf(msg.sender, id), "You do not own the character.");
        
        //set location
        shardLocation[id] = seed;
            
        //emit 
        emit Move(id, shardLocation[id]);
    }
    
    function move (uint256 id, bytes32 toShard) 
        public
    {
        //check for ownership 
        require(isOwnerOf(msg.sender, id), "You do not own the character.");
        require(Cool.cooldown(id) < block.timestamp, "Character is in cooldown.");
        
        //move 
        _move(id, toShard);
    }
}