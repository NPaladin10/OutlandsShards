// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";

/*
    Deployed 
    Goerli 0.1 - 0xd6fDb4Ed121c0F081F873E33Ced4752BE0379AC6 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract OutlandsRegions is PausableCPX {
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //
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
    uint256 internal IDNFT = 10**9 + 10**6;
    
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
    
    function addRegion (uint256 _realm, uint8[] calldata _anchors, address player) 
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
        returns (uint256 realm, uint8[] memory anchors)
    {
        return (_regions[id].r, _regions[id].a);
    }
    
    function getRegionRealm (uint256 id) 
        public
        view
        returns (uint256)
    {
        return _regions[id].r;
    }
}

/*
    Deployed 
    Goerli 0.1 - 0x71F28DF03E4465844ad0eAc2E2DFBFD6A739aAde (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x7E4957eF381ce2744F8B9d3EAd2B74889143CbBF (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.3 - 0x0DA9265d5A9041eb639a2E03347614427f020432 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.4 - 0x34109B71fb01046B514aBf23733e44439071c247 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract OutlandsShards is PausableCPX {
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    //contracts 
    Gatekeeper internal GK;
    OutlandsRegions internal OR;

    //Events 
    event NewShard(uint256 id, uint256 region, uint256 anchor, bytes32 seed); 
    
    /*
        @Dev the individual shards 
        r = region 
        a = anchor 
    */
    struct Shard {
        bytes32 seed;
        uint256 r;
        uint8 a; 
    }
    //shard mapping   
    mapping (uint256 => Shard) internal _shards;
    mapping (bytes32 => uint256) internal _seedToId;
    
    uint256 public constant IDNFT = 10**9;
    uint256 public countOfShards;

    //constructor
    constructor(Gatekeeper gk, OutlandsRegions or)
        public
    {
        GK = gk;
        OR = or;
    }
    
    /*
        internal
    */
    
    function _regionRealm (uint256 id)
        internal
        view 
        returns  (uint256) 
    {
        return OR.getRegionRealm(id);
    }
    
    function _regionAnchors (uint256 id)
        internal
        view 
        returns  (uint8[] memory a) 
    {
        (, a) = OR.getRegion(id);
    }
    
    /*
        View Functions 
    */
    
    function isClaimedById (uint256 id) 
        public
        view
        returns (bool)
    {
        return _shards[id].seed != bytes32(0);
    }
    
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
        returns (bytes32 seed, uint256 region, uint8 anchor)
    {
        return (_shards[id].seed, _shards[id].r, _shards[id].a);
    }
    
    function getShardBySeed (bytes32 _seed) 
        public
        view
        returns (bytes32 seed, uint256 region, uint8 anchor)
    {
        uint256 _id = _seedToId[_seed]; 
        //it is claimed 
        if(_id > 0) {
            return (_shards[_id].seed, _shards[_id].r, _shards[_id].a);
        }
        //generate 
        else {
            return _getShardDataFromSeed(_seed); 
        }
    }
    
    function getClaimedShardsByPage (uint256 page) 
        public
        view
        returns (bytes32[] memory seeds, uint256[] memory rids, uint8[] memory anchors)
    {
        uint256 start = (page * 50) + 1;
        require(countOfShards > start);
        
        //set end point 
        uint256 end = start + 49;
        if(countOfShards < end){
            end = countOfShards;
        }

        //establish dynamic array size 
        uint256 l = 1 + end - start;
        seeds = new bytes32[](l);
        rids = new uint256[](l);
        anchors = new uint8[](l);

        //loop through mapping 
        for(uint256 i = 0; i < l; i++){
            uint256 _id = IDNFT+start+i;
            
            //load array data 
            seeds[i] = _shards[_id].seed;
            rids[i] = _shards[_id].r;
            anchors[i] = _shards[_id].a;
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
        require(_region != 0 && _regionRealm(_region) != 0, "Improper region.");
        
        //increase count and check 
        id = ++countOfShards + IDNFT;
        require(_shards[id].seed == bytes32(0) && _seedToId[_seed] == 0, "Shard has been claimed.");
        
        
        //set shard 
        _shards[id] = Shard(_seed, _region, _anchor);
        //set claim 
        _seedToId[_seed] = id; 
        
        //grant token - IDNFT used in GK as NFT id 
        uint256[] memory ids = new uint256[](1);
        ids[0] = IDNFT;
        uint256[] memory amts = new uint256[](1);
        amts[0] = 1;
        
        GK.mint(player, ids, amts);
        
        emit NewShard(id, _region, _anchor, _seed);
    }
    
    //generate random shard based upon region 
    function _generateShard (uint256 r, address player) 
        internal
        returns (uint256 id)
    {
        //seed 
        bytes32 seed = keccak256(abi.encode(address(this), id, block.timestamp));
        //anchor
        uint8 a = _getShardAnchorFromSeed(seed, r); 

        //set and emit 
        return _addShard(seed, r, a, player); 
    }
    
    //admin level function to re-write data 
    function setShard (uint256 _id, bytes32 _seed, uint256 _region, uint8 _anchor) 
        public
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        
        //set shard 
        _shards[_id] = Shard(_seed, _region, _anchor);
        //set claim 
        _seedToId[_seed] = _id;
    }
    
    /*
        external functions for use by other contracts 
    */
    
    function addShardByData (bytes32 _seed, uint256 _region, uint8 _anchor, address player) 
        public
        returns (uint256 id)
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        //set and emit 
        return _addShard(_seed, _region, _anchor, player); 
    }
    
    function generateShardInRegion (uint256 r, address player) 
        public
        returns (uint256 id)
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");

        //set and emit 
        return _generateShard(r, player); 
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
        uint256 id = _seedToId[seed]; 
        region = id > 0 ? region = _shards[id].r : _getShardRegionFromSeed(seed);  
        realm = OR.getRegionRealm(region);
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
        RANDOM SHARDS 
        Handle random shards for exploration
    */
    
    /*
        random region depending upon current region count 
        - thus it may change if regions are added 
    */
    function _getShardRegionFromSeed (bytes32 _seed)
        internal
        view
        returns (uint256)
    {
        return 1 + (uint256(_seed) % OR.countOfRegions());
    }
    
    function _getShardAnchorFromSeed (bytes32 _seed, uint256 r)
        internal
        view
        returns (uint8)
    {
        //anchor
        uint8[] memory anchors = _regionAnchors(r);  
        uint256 n = anchors.length;
        return anchors[uint8(_seed[1]) % n];
    }
    
    function _getShardDataFromSeed (bytes32 _seed) 
	    internal
	    view
	    returns (bytes32 seed, uint256 r, uint8 a)
    {
        seed = _seed;
        r = _getShardRegionFromSeed(_seed);
        a = _getShardAnchorFromSeed(_seed, r);
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
    function claimShardBySeed (bytes32 seed) 
        public
        returns (uint256)
    {
        require(GK.balanceOf(msg.sender, _price[0]) >= _price[1], "Not enough tokens.");
        //burn tokens 
        GK.burn(msg.sender, _price[0], _price[1]);
        
        //get data 
        (, uint256 r, uint8 a) = _getShardDataFromSeed(seed);
        
        //set and emit 
        return _addShard(seed, r, a, msg.sender);
    }
}