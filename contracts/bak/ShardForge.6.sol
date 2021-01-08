// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";
import "./Rarity.sol";

/*
    Deployed 
    local 0.2 - 0x23F91D9F1E0799ac4159a37E813Bc449C294Ade2
    Goerli 0.1 - 0xd6fDb4Ed121c0F081F873E33Ced4752BE0379AC6 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x4141fbe02e62aD6D5ddA658D3a4d30d0C18Aa98e (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract OutlandsRegions is PausableCPX {
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    //contracts 
    Gatekeeper internal GK;

    //Events 
    event NewRegion(uint256 id, uint256 realm, uint8[] anchors); 

    /*
        @Dev Region struct  
        r = realm  
        a = anchors  
    */
    struct Region {
        uint256 r;
        uint8[] a; 
    }
    mapping (uint256 => Region) internal _regions;
    uint256 public countOfRegions;
    
    //NFT id 
    uint256 public constant IDNFT = 10**9 + 10**6;
    
    //constructor
    constructor(Gatekeeper gk)
        public
    {
        GK = gk;
    }
    
    /*
        Region set/add functions   
    */
    function _setRegion (uint256 _id, uint256 _realm, uint8[] calldata _anchors) 
        internal
    {
        require(!_isPaused, "Contract is paused.");
        require(_realm > 0, "Cannot assign realm 0.");
        
        //set data 
        _regions[_id] = Region(_realm, _anchors);
    }
    
    function setRegion (uint256 _id, uint256 _realm, uint8[] calldata _anchors) 
        public
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");

        //set
        _setRegion(_id, _realm, _anchors);
    }
    
    function mintRegion (uint256 _realm, uint8[] calldata _anchors, address player) 
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");

        //set region
        uint256 id = ++countOfRegions;
        _setRegion(id, _realm, _anchors);
        
        //grant token - IDNFT used in GK as NFT id 
        uint256[] memory ids = new uint256[](1);
        ids[0] = IDNFT;
        uint256[] memory amts = new uint256[](1);
        amts[0] = 1;
        
        //mint
        GK.mint(player, ids, amts);
        
        //emit
        emit NewRegion(id, _realm, _anchors);
    }
    
    /*
        get information 
    */
    
    function getRegion (uint256 id) 
        public
        view
        returns (uint256 r, uint8[] memory a)
    {
        return (_regions[id].r, _regions[id].a);
    }
    
        
    function _genAnchorFromSeed (bytes32 seed, uint256 r)
        internal
        view
        returns (uint8 a)
    {
        //anchor
        uint8[] memory anchors = _regions[r].a;  
        uint256 n = anchors.length;
        return anchors[uint8(seed[1]) % n];        
    }
    
    /*
        random region depending upon current region count 
        - thus it may change if regions are added 
    */
    function genRegionFromSeed (bytes32 seed)
        public
        view
        returns (uint256 id)
    {
        return 1 + (uint256(seed) % countOfRegions);
    }
    
    //provides the whole region data from a seed
    function getRegionFromSeed (bytes32 seed)
        public
        view
        returns (uint256 id, uint256 r, uint8[] memory a)
    {
        id = genRegionFromSeed(seed);
        r = _regions[id].r;
        a = _regions[id].a;
    }
    
    //generates a shard from a given seed 
    function genShardFromSeed (bytes32 seed) 
        public
        view
        returns (uint256 r, uint8 a)
    {
        r = genRegionFromSeed(seed);
        a = _genAnchorFromSeed(seed, r);
    }
}

/*
    Deployed 
    local 0.5 - 0x8f3186299dB5058E771eAFDD0Ed5776764DF4872
    local 0.6 - 0x782d52eC87e4690035824aE663FbBfaEBcEC6172
    Goerli 0.1 - 0x71F28DF03E4465844ad0eAc2E2DFBFD6A739aAde (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x7E4957eF381ce2744F8B9d3EAd2B74889143CbBF (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.3 - 0x0DA9265d5A9041eb639a2E03347614427f020432 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.4 - 0x34109B71fb01046B514aBf23733e44439071c247 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.5 - 0xEa6E5c8ABf8a46a85664431BC416C4caFA657C34 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.6 - 
*/
contract OutlandsShards is PausableCPX {
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    //contracts 
    Gatekeeper internal GK;
    OutlandsRegions internal OR;
    RarityCalculator internal RC;

    //Events 
    event NewShard(uint256 id, uint256 region, uint256 anchor, bytes32 seed); 
    
    /*
        @Dev the individual shards 
        r = region 
        a = anchor 
    */
    struct Shard {
        uint256 id;
        uint256 r;
        uint8 a; 
    }
    //shard mapping   
    mapping (bytes32 => Shard) internal _shards;
    mapping (uint256 => bytes32) internal _idToSeed;
    
    uint256 public constant IDNFT = 10**9;
    uint256 public countOfShards;

    //constructor
    constructor(Gatekeeper gk, OutlandsRegions or, RarityCalculator rc)
        public
    {
        GK = gk;
        OR = or;
        RC = rc; 
    }
    
    /*
        View Functions 
    */
    
    function isClaimedById (uint256 id) 
        public
        view
        returns (bool)
    {
        return _idToSeed[id] != bytes32(0);
    }
    
    function isClaimedBySeed (bytes32 seed) 
        public
        view
        returns (bool)
    {
        return _shards[seed].r != 0;
    }
    
    //check ownership
    function isOwnerOf (address player, uint256 id) 
        public
        view
        returns (bool)
    {
        return GK.balanceOf(player, id) == 1; 
    }
    
    function getShardById (uint256 id) 
        public
        view
        returns (bytes32 seed, uint256 r, uint8 a, uint256 rare)
    {
        seed = _idToSeed[id];
        return (seed, _shards[seed].r, _shards[seed].a, RC.rarity(seed, 1));
    }
    
    function getShardBySeed (bytes32 seed) 
        public
        view
        returns (uint256 id, uint256 r, uint8 a, uint256 rare)
    {
        rare = RC.rarity(seed, 1);
        //it is claimed 
        if(isClaimedBySeed(seed)) {
            id = _shards[seed].id;
            r = _shards[seed].r;
            a = _shards[seed].a;
        }
        //generate 
        else {
            id = 0; 
            (r, a) = OR.genShardFromSeed(seed);
        }
    }
    
    function getClaimedShardsBatch (uint256[] calldata ids) 
        public
        view
        returns (bytes32[] memory seeds, uint256[] memory rids, uint8[] memory anchors, uint256[] memory rarity)
    {
        uint256 l = ids.length;
        require(l <= 50, "Cannot view too many.");
        
        //establish dynamic array size 
        seeds = new bytes32[](l);
        rids = new uint256[](l);
        anchors = new uint8[](l);
        rarity = new uint256[](l);

        //loop through mapping 
        for(uint256 i = 0; i < l; i++){
            uint256 _id = ids[i];
            
            //load array data 
            seeds[i] = _idToSeed[_id];
            rids[i] = _shards[seeds[i]].r;
            anchors[i] = _shards[seeds[i]].a;
            rarity[i] = RC.rarity(seeds[i], 1);
        }
    }
    
    /*
        SHARDS 
        Allows for control of shard data 
    */
    
    //internal used by a number of external functions 
    function _addShard (bytes32 _seed, uint256 _region, uint8 _anchor, address player) 
        internal
        returns (uint256 id)
    {
        require(!_isPaused, "Contract is paused.");
        require(_region != 0, "Improper region.");
        require(!isClaimedBySeed(_seed), "Shard has been claimed.");
        
        //increase count and check 
        id = ++countOfShards + IDNFT;
        
        //set shard 
        _shards[_seed] = Shard(id, _region, _anchor);
        //set claim 
        _idToSeed[id] = _seed; 
        
        //grant token - IDNFT used in GK as NFT id 
        uint256[] memory ids = new uint256[](1);
        ids[0] = IDNFT;
        uint256[] memory amts = new uint256[](1);
        amts[0] = 1;
        
        GK.mint(player, ids, amts);
        
        emit NewShard(id, _region, _anchor, _seed);
    }
    
    //admin level function to re-write data 
    function setShard (uint256 _id, bytes32 _seed, uint256 _region, uint8 _anchor) 
        public
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        
        //set shard 
        _shards[_seed] = Shard(_id, _region, _anchor);
        //set claim 
        _idToSeed[_id] = _seed;
    }
    
    /*
        external functions for use by other contracts 
    */
    
    function mintShardByData (bytes32 _seed, uint256 _region, uint8 _anchor, address player) 
        public
        returns (uint256 id)
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        //set and emit 
        return _addShard(_seed, _region, _anchor, player); 
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
        returns (uint256 region, uint256 realm)
    {
        (, region, , ) = getShardBySeed(seed);
        (realm, ) = OR.getRegion(region);
    }

    // Get the time to move based upon starting shard and ending shard 
    function getTravelTime (bytes32 fromId, bytes32 toId)
        public
        view
        returns (uint256)
    {
        //check region & realm
        (uint256 startRegion, uint256 startRealm) = getShardRegionRealm(fromId);
        (uint256 endRegion, uint256 endRealm) = getShardRegionRealm(toId);
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
    
    /*
        Using tokens to claim shards 
    */
    uint256[2] internal _price = [201, 100]; 
    
    function setPrice (uint256[2] calldata _p) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _price = _p;
    }
    
    
    //allow player to claim a shard by providing a seed   
    function claimShard (bytes32 seed) 
        public
        returns (uint256)
    {
        require(GK.balanceOf(msg.sender, _price[0]) >= _price[1], "Not enough tokens.");
        //burn tokens 
        GK.burn(msg.sender, _price[0], _price[1]);
        
        //get data 
        (, uint256 r, uint8 a, ) = getShardBySeed(seed);
        
        //set and emit 
        return _addShard(seed, r, a, msg.sender);
    }
}