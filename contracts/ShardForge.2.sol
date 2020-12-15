// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";

/*
    Deployed 
    Goerli 0.1 - 0x71F28DF03E4465844ad0eAc2E2DFBFD6A739aAde (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x7E4957eF381ce2744F8B9d3EAd2B74889143CbBF (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.3 - 0x0DA9265d5A9041eb639a2E03347614427f020432 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract OutlandsShards is PausableCPX {
    //0xb0c6d6c98634bf90c5127f65c948b52cc8ad5f3b499bdb4170d0b685e60ee0df
    bytes32 public constant REGION_ADMIN = keccak256("REGION_ADMIN");
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //0x21657ad0c2bcaaadf80aed5c375ac4fcc061eb4ab27f7323c2172cbefae53a85
    bytes32 public constant CURRENT_MINTER = keccak256("CURRENT_MINTER");

    //contracts 
    Gatekeeper internal GK;

    //Events 
    event NewRegion(uint256 id, uint256 realm, uint8[] anchors); 
    event NewShard(uint256 id, uint256 region, uint256 anchor, bytes32 seed); 
    
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
    uint256 public nRegions;
    
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
    uint256 public count;

    //constructor
    constructor(Gatekeeper gk)
        public
    {
        GK = gk;
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
    
    function getClaimedShard (uint256 id) 
        public
        view
        returns (bytes32 seed, uint256 region, uint8 anchor)
    {
        return (_shards[id].seed, _shards[id].r, _shards[id].a);
    }
    
    function getShardByPage (uint256 page) 
        public
        view
        returns (bytes32[] memory seeds, uint256[] memory rids, uint8[] memory anchors)
    {
        uint256 start = (page * 50) + 1;
        require(count > start);
        
        //set end point 
        uint256 end = start + 49;
        if(count < end){
            end = count;
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
        REGIONS 
        Region functions   
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
        require(hasRole(REGION_ADMIN, msg.sender), "Caller is not allowed.");

        //set
        _setRegion(_id, _realm, _anchors);
    }
    
    function addRegion (uint256 _realm, uint8[] calldata _anchors) 
        public
    {
        require(hasRole(REGION_ADMIN, msg.sender), "No permission.");

        //set region
        uint256 id = ++nRegions;
        _setRegion(id, _realm, _anchors);
        
        //emit
        emit NewRegion(id, _realm, _anchors);
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
        require(_region != 0 && _regions[_region].r != 0, "Improper region.");
        
        //increase count and check 
        id = ++count + IDNFT;
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
        uint8 a = _randomShardAnchor(seed, r); 

        //set and emit 
        return _addShard(seed, r, a, player); 
    }
    
    //admin level function to re-write data 
    function setShard (uint256 _id, bytes32 _seed, uint256 _region, uint8 _anchor) 
        public
    {
        require(hasRole(REGION_ADMIN, msg.sender), "No permission.");
        
        //set shard 
        _shards[_id] = Shard(_seed, _region, _anchor);
        //set claim 
        _seedToId[_seed] = _id;
    }
    
    function addShard (bytes32 _seed, uint256 _region, uint8 _anchor, address player) 
        public
        returns (uint256 id)
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        //set and emit 
        return _addShard(_seed, _region, _anchor, player); 
    }
    
    function generateShard (uint256 r, address player) 
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
    
    function getShardRegionRealm (bytes32 seed) 
        public
        view
        returns (uint256 region, uint256 realm)
    {
        uint256 id = _seedToId[seed]; 
        region = id > 0 ? region = _shards[id].r : _randomShardRegion(seed);  
        realm = _regions[region].r;
    }

    // Get the time to move based upon starting shard and ending shard 
    function getTime (bytes32 fromId, bytes32 toId)
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
      Handle random shard creation.
      _periods defines how many periods and their durations
      _shardsPerPeriod defines how many shards may appear in that period
    */
    uint256[] internal _periods = [4 * 1 hours, 8 * 1 hours, 1 days];
    uint256[3][] internal _shardsPerPeriod = [[24,3,8],[24,3,8],[24,3,8]];
    
    /*
        RANDOM SHARDS 
        Handle random shards for exploration
    */
    
    //returns a seed based upon the period and the index of the shard 
    function _randomShardSeed (uint256 pt, uint256 pOfi, uint256 j) 
        internal
	    view
	    returns (bytes32)
    {
	    return keccak256(abi.encode(address(this), pt, pOfi, j));    
    }
    
    /*
        random region depending upon current region count 
        - thus it may change if regions are added 
    */
    function _randomShardRegion (bytes32 seed) 
	    internal
	    view
	    returns (uint256)
    {
	    return 1 + (uint256(seed) % nRegions);
    }
    
    function _randomShardAnchor (bytes32 seed, uint256 r) 
        internal 
        view
        returns (uint8)
    {
        //anchor 
        uint256 n = _regions[r].a.length;
        return _regions[r].a[uint8(seed[1]) % n];
    }
    
    function _validateCurrentShard (uint256 pid, uint256 j, bytes32 seed)
        internal
        view
        returns (bool)
    {
        uint256[] memory p = getCurrentPeriod();
        return _randomShardSeed(_periods[pid], p[pid], j) == seed;
    }
    
    //get the count of the current allowable number of shards in a period
    function _periodShardCount (uint256 pid, uint256 ofPi) 
	    internal
	    view
	    returns (uint256 sCount)
    {
	    //get period info 
	    uint256 pt = _periods[pid];
	    uint256[3] memory spp = _shardsPerPeriod[pid];
	    
	    //seed for generation 
	    bytes32 seed = keccak256(abi.encode(address(this), pt, ofPi));
	    
	    //start with base 
	    sCount = spp[0];
	    //loops as required in spp 
    	for(uint256 i = 0; i < spp[1]; i++){
    	    sCount += 1 + (uint8(seed[i]) % spp[2]);	
    	}
    }
    
    /*
        admin set function for periods 
    */
    
    function addPeriod(uint256 time) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        uint256 i = _periods.length;
        _periods[i] = time; 
    }
    
    function setPeriod(uint256 i, uint256 time) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _periods[i] = time; 
    }
    
    /*
        view of period information
    */ 
    
    //period times 
    function getPeriodTimes () 
        public
        view
        returns (uint256[] memory)
    {
        return _periods;
    }
    
    //return the current period based upon the timestamp
    function getCurrentPeriod () 
	    public
	    view
	    returns (uint256[] memory p)
    {
        uint256 l = _periods.length;
        p = new uint256[](l);
    	uint256 _now = block.timestamp;
    	
    	//loop 
    	for(uint256 i = 0; i < l; i++){
    	    //simple division to determine period - uint256 math drops remainder
    	    p[i] = _now / _periods[i]; 
    	}
    }
    
    /*
        Look up specific shard data from a period 
    */
    function getShardDataOfPeriod (uint256 pid, uint256 pOfi, uint256 j) 
        public
        view 
        returns (bytes32 seed, uint256 r, uint8 a)
    {
        require(j <= _periodShardCount(pid, pOfi), "Not in selected period.");
        
        seed = _randomShardSeed(_periods[pid], pOfi, j);
        r = _randomShardRegion(seed);
        a = _randomShardAnchor(seed, r);
    }
    
    function getShardDataOfCurrentPeriod (uint256 pid, uint256 j) 
        public
        view 
        returns (bytes32 seed, uint256 r, uint8 a)
    {
        uint256[] memory p = getCurrentPeriod();
        return getShardDataOfPeriod(pid, p[pid], j);
    }
    
    //useful for adding a current shard 
    function addCurrentShard (uint256 pid, uint256 j, address player) 
        public
        returns (uint256 id)
    {
        require(hasRole(CURRENT_MINTER, msg.sender), "No permission.");

        //get data 
        (bytes32 seed, uint256 r, uint8 a) = getShardDataOfCurrentPeriod(pid, j);
        
        //set and emit 
        return _addShard(seed, r, a, player); 
    }
    
    /*
        Using tokens to claim shards 
    */
    uint256[2][] internal _prices; 
    
    function setPrices (uint256[] calldata ids, uint256[] calldata amts) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        uint256 l = ids.length;
        _prices = new uint256[2][](l);
        
        //loop and set prices 
        for(uint256 i = 0; i < l; i++){
            _prices[i] = [ids[i], amts[i]];
        }
    }
    
    
    //allow player to claim current shars  
    function claimCurrentShard (uint256 pid, uint256 j) 
        public
        returns (uint256)
    {
        //burn tokens 
        GK.burn(msg.sender, _prices[0][0], _prices[0][1]);
        
        //get data 
        (bytes32 seed, uint256 r, uint8 a) = getShardDataOfCurrentPeriod(pid, j);
        
        //set and emit 
        return _addShard(seed, r, a, msg.sender);
    }
    
    function claimPastShard (uint256 pid, uint256 pOfi, uint256 j) 
        public
        returns (uint256)
    {
        //burn tokens 
        GK.burn(msg.sender, _prices[1][0], _prices[1][1]);
        
        //get data 
        (bytes32 seed, uint256 r, uint8 a) = getShardDataOfPeriod(pid, pOfi, j);
        
        //set and emit 
        return _addShard(seed, r, a, msg.sender);
    }
    
    function claimNewRegionShard (uint256 r) 
        public
        returns (uint256)
    {
        //burn tokens 
        GK.burn(msg.sender, _prices[1][0], _prices[1][1]);
        
        //set and emit 
        return _generateShard(r, msg.sender);
    }
}


