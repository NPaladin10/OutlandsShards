// CharacterForge.sol
// V0.1
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./TreasureGiver.sol";
import "./ShardForge.sol";
import "./CharacterForge.sol";

/*
    Deployed 
    local 0.1 - 0xF1dAE2f865Dc05B47F16Ff4874d95aC5f11FB482
*/

contract ExploreShard is TreasureGiver {
    //contracts
    CharacterLocation internal CL;

    //number of treasures to be generated 
    uint8[] nT = [1,1,1,1,2,2,2,3];
    
    //shard cooldown
    uint256 public shardCooldown = 22 * 1 hours; 
    mapping (bytes32 => uint256) public shardTimer;
    
    //counting which shards have been explored
    mapping (bytes32 => uint256) public countExploreByShard;
    //counting which explorers have explored 
    mapping (uint256 => uint256) public countExploreByExplorer;
    
    //conversion for use in randomization
    uint256[8] internal _d8Tod4 = [1,1,2,2,2,3,3,4];
    //risk based upon the anchor 
    uint256[5] internal _anchorRisk = [3,1,0,2,1];
    //cooldown in hours based upon anchorrisk and rarity/size  
    uint256[4][4] internal _riskCooldown = [[4,6,10,16],[10,12,16,22],[16,18,22,28],[22,24,28,34]];
    //rewards 
    uint256[20][4] internal _anchorTreasure;
    
    //event 
    event ExploredShard (bytes32 seed, uint256 id, uint256[] t, uint256 cool);
    
    //constructor
    constructor(TreasureMinter tm, CharacterLocation cl)
        public
        TreasureGiver(tm)
    {
        CL = cl;

        //set treasure index  
        _anchorTreasure[0] = [0,1,1,0,1,2,2,1,2,3,3,2,3,4,4,3,4,5,5,4];
        _anchorTreasure[1] = [0,1,1,2,1,2,2,3,2,3,3,4,3,4,4,5,4,5,5,6];
        _anchorTreasure[2] = [1,1,2,1,2,2,3,2,3,3,4,3,4,4,5,4,5,5,6,5];
        _anchorTreasure[3] = [2,1,2,1,3,2,3,2,4,3,4,3,5,4,5,4,6,5,6,5];
        
        //set treasure
        _treasureLists[0] = [6,7,8,9,10,11];
        _treasureLists[1] = [1001,1002,1003,1004,1005,1006];
        _treasureLists[2] = [2001,2002,2003,2004,2005,2006,2007];
        _treasureLists[3] = [3001,3002,3003,3004,3005,3006];
        _treasureLists[4] = [4001,4002,4003,4004,4005,4006];
        _treasureLists[5] = [5001];
        _treasureLists[6] = [6001];
    }
    
    /*
        internal calculations  
    */
    //cooldown calculation 
    function _getCool (uint8 _type, uint256 r) 
        internal
        returns (uint256 cool) 
    {
        //random d4 
        bytes32 rand = keccak256(abi.encode(address(this), block.timestamp, ++_count));
        uint256 d4 = uint256(rand)%4;
        
        //cool calc 
        uint256 risk = _anchorRisk[_type-1];
        uint256 d8 = r-1+d4;
        //cooldown is based on risk, the rarity = size and d4 
        cool = _riskCooldown[risk][_d8Tod4[d8]];
    }
    
    function _getReward (uint8 _type, uint256 r) 
        internal
        returns (uint256[] memory t) 
    {
        //random d8 
        bytes32 rand = keccak256(abi.encode(address(this), block.timestamp, ++_count));
        uint256 subTi = _d8Tod4[uint256(rand)%8];
        uint256 ti = 5*(r-1) + subTi;
        
        //anchor treasure  
        uint256 risk = _anchorRisk[_type-1];
        uint256 _t = _anchorTreasure[risk][ti];
        
        //function _generateTreasure (uint256[] memory list, uint8[] memory nT) returns (uint256[] memory treasure)
        return _generateTreasure(_treasureLists[_t], nT);
    }
    
    /*
        admin functions 
    */
    
    function setContracts (CharacterLocation cl)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        CL = cl;
    }
    
    //set base cooldown of a shard
    function setShardCooldown (uint256 _cool) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        shardCooldown = _cool;
    }
    
    //set anchor treasure array 
    function setAnchorTreasure (uint256 i, uint256[20] calldata tids) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _anchorTreasure[i] = tids;
    }
    
    //set cooldown based upon risk  
    function setRiskCooldown (uint256[4][4] calldata _cool) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _riskCooldown = _cool;
    }
    
    /*
        external explore function
    */
    
    function explore (uint256 id) 
        public
        returns (uint256 cool, uint256[] memory t)
    {
        //require ownership
        require(CL.isOwnerOf(msg.sender, id), "You do not own the explorer.");
        
        //require cool 
        uint256 _now = block.timestamp; 
        require(_now > CL.getCooldown(id), "Character srequires cooldown.");
        
        //pull data 
        (bytes32 seed, , uint8 _type, uint256 _rarity, ) = CL.getShardData(id);
        require(_now > shardTimer[seed], "Shard is not ready.");

        //get cooldown 
        cool = _now + (_getCool(_type, _rarity) * 1 hours);
        
        //set cooldown for character and shard 
        CL.setCooldown(id, cool);
        shardTimer[seed] = _now + (shardCooldown/_rarity);
        
        //generate treasure & mint 
        t = _getReward(_type, _rarity);
        _mint(msg.sender, t);
        
        //update counts 
        countExploreByExplorer[id]++;
        countExploreByShard[seed]++;
        
        //emit 
        emit ExploredShard(seed, id, t, cool);
    }
}


contract ClaimShardExplore is TreasureGiver {
    //contracts
    ExploreShard internal ES;
    OutlandsShards internal OS;
    
    //number of treasures to be generated 
    uint8[] nT = [1,1,1,1,2,2,2,3];
    
    //track claims 
    mapping (bytes32 => uint256) internal _claims; 
    
    //constructor
    constructor(TreasureMinter tm, ExploreShard es, OutlandsShards os)
        public
        TreasureGiver(tm)
    {
        ES = es; 
        OS = os; 
    }
    
    function claimReward (bytes32 seed) 
        public
    {
        //get the shard data 
        (uint256 id, , , uint256 _rare) = OS.getShardBySeed(seed);
        
        //require id 
        require(id > 0, "Shard is not claimed.");
        //require ownership
        require(OS.isOwnerOf(msg.sender, id), "Not the owner of the shard.");
        //check claims vs available 
        uint256 _n = ES.countExploreByShard(seed) - _claims[seed];  
        require(_n > 0, "All the rewards are claimed.");
        
        //update claims 
        _claims[seed] = ES.countExploreByShard(seed);
        
        //loop for every claim 
        for(uint256 i = 0; i < _n; i++) {
            //generate treasure & mint
            //_generateTreasure (uint256[] memory list, uint8[] memory nT) returns (uint256[] memory treasure)
            uint256[] memory t = _generateTreasure(_treasureLists[_rare], nT);
            _mint(msg.sender, t);
        }
    }
}