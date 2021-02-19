/*
    OutlandsShards.sol
    v0.8
    
    SPDX-License-Identifier: MIT
*/ 
pragma solidity ^0.6.0;

import "./OutlandsRegions.sol";

/*
    Deployed 
    local 0.5 - 0x8f3186299dB5058E771eAFDD0Ed5776764DF4872
    local 0.6 - 0x782d52eC87e4690035824aE663FbBfaEBcEC6172
    local 0.7 - 0xcA7aae1456357f4100c3120124142571e4618984
    local 0.8 - 0x40F35e140392265b3D1791f6aa5036EFFfE0deE5
    Goerli 0.1 - 0x71F28DF03E4465844ad0eAc2E2DFBFD6A739aAde (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x7E4957eF381ce2744F8B9d3EAd2B74889143CbBF (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.3 - 0x0DA9265d5A9041eb639a2E03347614427f020432 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.4 - 0x34109B71fb01046B514aBf23733e44439071c247 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.5 - 0xEa6E5c8ABf8a46a85664431BC416C4caFA657C34 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.6 - 
*/
contract OutlandsShards is NFTKeeper {
    //IDs 
    uint8 public constant SEED_ID = 1;
    uint8 public constant REGION_ID = 2;
    uint8 public constant ANCHOR_ID = 3;
    
    //array for use later 
    uint256[] internal _statIds = [SEED_ID, REGION_ID, ANCHOR_ID];
    
    //contracts 
    OutlandsRegions internal OR;

    //Events 
    event Mint(uint256 indexed id, int256 region, int256 anchor, bytes32 seed); 
    
    mapping (bytes32 => uint256) internal _seedToId;
    
    //constructor
    constructor(Gatekeeper gk, OutlandsRegions or)
        public
        NFTKeeper(gk, 10**9)
    {
        OR = or;
    }
    
    /*
        admin 
    */
    function setContract (Gatekeeper gk, OutlandsRegions or) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        GK = gk;
        OR = or;
    }
    
    /*
        internal 
    */
    
    function _setShard (uint256 id, bytes32 _seed, int256 r, int256 a) 
        internal
    {
        //function setStat (uint256 id, uint256 i, int256 val)
        //setStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals)
        
        //handle seeds 
        _seedToId[_seed] = id;
        
        //stat vals 
        int256[] memory _vals = new int256[](3);
        _vals[0] = int256(_seed);
        _vals[1] = r;
        _vals[2] = a; 
        
        //set 
        GK.setStatBatch(id, _statIds, _vals);
    }
    
    /*
        Shard Data 
        r = region 
        a = anchor 
    */
    function _getData (uint256 id) 
        internal
        view
        returns (bytes32 seed, int256 r, int256 a, uint256 rare)
    {
        //[SEED_ID, REGION_ID, ANCHOR_ID]
        int256[] memory vals = GK.getStatBatch(id, _statIds);
        seed = bytes32(vals[0]);
        return (seed, vals[1], vals[2], GK.getRarity(seed, 1, 0, 2));
    }
    
    /*
        View Functions 
    */
    
    function isClaimedBySeed (bytes32 seed) 
        public
        view
        returns (bool)
    {
        return _seedToId[seed] != 0;
    }
    
    function getShardById (uint256 id) 
        public
        view
        returns (bytes32 seed, int256 r, int256 a, uint256 rare)
    {
        return _getData(id);
    }
    
    function getShardBySeed (bytes32 seed) 
        public
        view
        returns (uint256 id, int256 r, int256 a, uint256 rare)
    {
        id = _seedToId[seed];
        if(id != 0) {
            (, r, a, rare) = getShardById(id);
        }
        else {
            (uint256 _r, uint8 _a) = OR.genShardFromSeed(seed);
            r = int256(_r);
            a = int256(_a);
            rare = GK.getRarity(seed, 1, 0, 2);
        }
    }
    
    function getClaimedShardsBatch (uint256[] calldata ids) 
        public
        view
        returns (bytes32[] memory seeds, int256[] memory rids, int256[] memory anchors, uint256[] memory rarity)
    {
        uint256 l = ids.length;

        //establish dynamic array size 
        seeds = new bytes32[](l);
        rids = new int256[](l);
        anchors = new int256[](l);
        rarity = new uint256[](l);

        //loop through mapping 
        for(uint256 i = 0; i < l; i++){
            (seeds[i], rids[i], anchors[i], rarity[i]) = getShardById(ids[i]);
        }
    }
    
    /*
        SHARDS 
        Allows for control of shard data 
    */
    
    //admin level function to re-write data 
    function setShard (uint256 _id, bytes32 _seed, int256 _r, int256 _a) 
        public
    {
        require(!_isPaused, "Contract is paused.");
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        
        //set shard 
        _setShard(_id, _seed, _r, _a);
    }
    
    /*
        external functions for use by other contracts 
    */
    
    function mint (uint256 id, bytes calldata data) 
        public
        override
        returns (bytes memory shard)
    {
        require(!_isPaused, "Contract is paused.");
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        //decode data 
        (bytes32 _seed) = abi.decode(data, (bytes32));
        require(!isClaimedBySeed(_seed), "Shard has been claimed.");
        
        //generate 
        (uint256 _r, uint8 _a) = OR.genShardFromSeed(_seed);
        
        //set 
        _setShard(id, _seed, int256(_r), int256(_a));
        
        //data 
        shard = abi.encode(_seed, int256(_r), int256(_a), GK.getRarity(_seed, 1, 0, 2));
    }
    
    /*
    	Handle movement and determination of times 
    */
    
    //Move times: realm, region, shard 
    uint256[3] public moveTimes = [22 * 1 hours, 8 * 1 hours, 2 * 1 hours];

    function setMoveTimes (uint256[3] calldata _times)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        moveTimes = _times;
    }
    
    function getShardRegionRealm (bytes32 seed) 
        public
        view
        returns (int256 region, int256 realm)
    {
        (, region, , ) = getShardBySeed(seed);
        realm = OR.getRegionRealm(uint256(region));
    }

    // Get the time to move based upon starting shard and ending shard 
    function getTravelTime (bytes32 fromId, bytes32 toId)
        public
        view
        returns (uint256)
    {
        //check region & realm
        (int256 startRegion, int256 startRealm) = getShardRegionRealm(fromId);
        (int256 endRegion, int256 endRealm) = getShardRegionRealm(toId);
        require(startRegion != 0, "Not a valid move - start does not exist.");
        require(startRealm != 0, "Not a valid move - start does not exist.");
        require(endRegion != 0, "Not a valid move - end does not exist.");
        require(endRealm != 0, "Not a valid move - end does not exist.");

        //cooldown time
        if(startRealm != endRealm) {
            return moveTimes[0];
        }
        else if (startRegion != endRegion) { 
            return moveTimes[1];
        }
        else {
            return moveTimes[2];
        }
    }
}