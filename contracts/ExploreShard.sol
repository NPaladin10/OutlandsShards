// CharacterForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ShardForge.sol";
import "./Rarity.sol";
import "./TreasureGiver.sol";

contract ExploreShard is TreasureGiver {
    //contracts 
    OutlandsShards internal OS;
    RarityCalculator internal R;
    
    //number of treasures to be generated 
    uint8[] nT = [1,1,1,1,2,2,2,3];
    
    //conversion for use in randomization
    uint256[8] internal _d8Tod4 = [1,1,2,2,2,3,3,4];
    //risk based upon the anchor 
    uint256[5] internal _anchorRisk = [3,1,0,2,1];
    //cooldown in hours based upon anchorrisk and rarity/size  
    uint256[4][4] internal _riskCooldown = [[4,6,10,16],[10,12,16,22],[16,18,22,28],[22,24,28,34]];
    //rewards 
    uint256[20][4] internal _anchorTreasure;
    
    
    //constructor
    constructor(TreasureMinter _tm, OutlandsShards os, RarityCalculator r)
        public
        TreasureGiver(_tm)
    {
        OS = os;
        R = r; 
    }
    
    /*
        internal look up functions 
    */
    //get rarity of a site 
    function _getRarity (bytes32 seed) 
        internal
        view
        returns (uint256) 
    {
        return R.rarity(seed, 1);
    }
    
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
    
    function explore (uint256 id, bytes32 seed) 
        public
        returns (uint256 cool, uint256[] memory t)
    {
        //pull data 
        (, , uint8 _type) = OS.getShardBySeed(seed);
        uint256 _rarity = _getRarity(seed);
        
        //get cooldown 
        cool = _getCool(_type, _rarity) * 1 hours;
        
        //get treasure 
        t = _getReward(_type, _rarity);

        //set cool for shard 
    }
}


