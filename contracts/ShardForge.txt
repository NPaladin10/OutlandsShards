// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./CPXToken1155.sol";

/*
    Deployed 
    Goerli 0.1 - 0x71F28DF03E4465844ad0eAc2E2DFBFD6A739aAde (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x7E4957eF381ce2744F8B9d3EAd2B74889143CbBF (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract OutlandsShards is AccessControl {
    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant REGION_ADMIN = keccak256("REGION_ADMIN");
    //0xb0c6d6c98634bf90c5127f65c948b52cc8ad5f3b499bdb4170d0b685e60ee0df
    
    bool public isPaused;
    
    event NewShard(uint256 id, uint256 region, uint256 anchor, bytes32 seed); // Event
    
    /*
        @Dev Region struct  
        r = realm  
        a = anchors  
    */
    struct Region {
        uint256 r;
        uint8[] a; 
    }
    mapping (uint256 => Region) regions;
    
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
    mapping (uint256 => Shard) shards;
    uint256 public count = 0;
    
    //constructor
    constructor()
        public
    {
        isPaused = false;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /*
        View Functions 
    */
    
    function getRegion (uint256 _id) 
        public
        view
        returns (uint256 realm, uint8[] memory anchors)
    {
        realm = regions[_id].r;
        anchors = regions[_id].a;
    }
    
    function getRegionRealm (uint256 _id) 
        public
        view
        returns (uint256)
    {
        return regions[_id].r;
    }
    
    function getShard (uint256 _id) 
        public
        view
        returns (bytes32 seed, uint256 region, uint8 anchor)
    {
        seed = shards[_id].seed;
        region = shards[_id].r;
        anchor = shards[_id].a;
    }
    
    function getShardRegionRealm (uint256 _id) 
        public
        view
        returns (uint256 region, uint256 realm)
    {
        region = shards[_id].r;
        realm = regions[region].r;
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
            uint256 _id = start+i;
            
            //load array data 
            seeds[i] = shards[_id].seed;
            rids[i] = shards[_id].r;
            anchors[i] = shards[_id].a;
        }
    }
    
    /*
        Set Functions for internal variables 
    */
    
    function setPause (bool _paused) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN.");
        isPaused = _paused;
    }
    
    /*
        Set Functions for base data and generation  
    */
    
    function setRegion (uint256 _id, uint256 _realm, uint8[] calldata _anchors) 
        public
    {
        require(!isPaused, "Contract is paused.");
        require(hasRole(REGION_ADMIN, msg.sender), "Caller is not allowed.");
        require(_realm > 0);

        //set realm 
        regions[_id].r = _realm;
        
        if(_anchors.length == 16){
            regions[_id].a = _anchors;
        }
    }

    /*
        Allows for control of shard data 
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    */
    function setShard (uint256 _id, bytes32 _seed, uint256 _region, uint8 _anchor) 
        public
    {
        require(!isPaused, "Contract is paused.");
        require(hasRole(REGION_ADMIN, msg.sender), "Caller is not allowed.");
        if(_seed != 0) {
            shards[_id].seed = _seed;
        }
        if(_region != 0) {
            shards[_id].r = _region;
        }
        if(_anchor != 0) {
            shards[_id].a = _anchor;
        }
    }
    
    /*
        External functions  
    */
    
    function generateShard (uint256 _region) 
        public
    {
        require(!isPaused, "Contract is paused.");
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not allowed.");
        
        //increase id 
        uint256 id = ++count;
        //seed 
        bytes32 seed = keccak256(abi.encode(address(this), id, block.timestamp));
        //anchor 
        uint256 al = regions[_region].a.length;
        uint8 a = regions[_region].a[uint8(seed[0])%al];
        //set shard 
        shards[id] = Shard(seed, _region, a);
        
        //event 
        emit NewShard(id, _region, a, seed);
    }
}


/*
    Deployed 
    Goerli 0.1 - 0xEd094d3eA4d6509D7DBbAaD616F0EbD6b744c17E (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract MoveTime is AccessControl {
    //contracts 
    OutlandsShards public OS;
    
    //Move times: realm, region, shard 
    uint256[3] moveTimes = [22 * 1 hours, 8 * 1 hours, 2 * 1 hours];

    //constructor
    constructor(OutlandsShards _os)
        public
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        OS = _os;
    }
    
    function setMoveTimes (uint256[3] calldata _times)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        moveTimes = _times;
    }
    
    // Get the time to move based upon starting shard and ending shard 
    function getTime (uint256 fromId, uint256 toId)
        public
        view
        returns (uint256)
    {
        //check region & realm
        (uint256 startRegion, uint256 startRealm) = OS.getShardRegionRealm(fromId);
        (uint256 endRegion, uint256 endRealm) = OS.getShardRegionRealm(toId);
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

/*
    Deployed 
    Goerli 0.1 - 0x6c7AE89b23B1cF1023d2a04DfbA2F3141249662E (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract RarityCalculator is AccessControl {

    struct Rarity {
        uint256 max;
        uint8 start;
        uint8 stop; 
        uint256[] steps;
    }
    mapping (uint256 => Rarity) rarityIndex;
    
    //constructor
    constructor()
        public
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /*
        Set Functions for internal data   
    */
    
    function setRarity (uint256 id, uint256 max, uint8 start, uint8 stop, uint256[] calldata steps) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not allowed.");
        require(max > 0, "Must supply a maximum.");
        require(stop-start >= 1 && stop <= 32, "hex index must be within bounds.");

        rarityIndex[id] = Rarity(max, start, stop, steps);
    }
    
    /*
        View functions internal variables  
    */
    
    function getRarityIndex (uint256 id) 
        public
        view
        returns (uint256 max, uint256 start, uint256 stop, uint256[] memory steps)
    {
        Rarity memory R = rarityIndex[id];
        return (R.max, R.start, R.stop, R.steps);
    }
    
    /*
        View functions for generation  
    */
    
    function bytesSlicer (bytes32 data, uint8 start, uint8 end)
        public
        pure
        returns (bytes memory slice)
    {
        uint8 l = end-start;
        slice = new bytes(l);
        for(uint8 i = start; i < end; i++){
            slice[i-start] = data[i];
        }
    }
    
    function bytesToUint (bytes memory b) 
        public
        pure
        returns (uint256)
    {
        uint256 number;
        for(uint i=0;i<b.length;i++){
            number = number + uint8(b[i])*(2**(8*(b.length-(i+1))));
        }
        return number;
    }
    
    /*
        External calculation   
    */
    
    function rarity (bytes32 seed, uint256 _rarity) 
        public
        view
        returns (uint256)
    {
        Rarity memory R = rarityIndex[_rarity];
        uint256 sliced = bytesToUint(bytesSlicer(seed, R.start, R.stop));
        uint256 reduced = sliced % R.max;
        uint256 value = R.steps.length+1;
        
        for(uint256 i = 0; i < R.steps.length; i++){
            if(reduced < R.steps[i]) {
                value = i+1;
                break; 
            }
        }

        return value;
    }
}



contract ExploreShard is AccessControl {
    //contracts 
    OutlandsShards public OS;
    
    uint256 public count = 0;
    
    uint8[5] public anchorRisk = [3,1,0,2,1];
    uint8[8][4] public riskCooldown = [[4,4,6,6,6,10,10,16],[10,10,12,12,12,16,16,22],[16,16,18,18,18,22,22,28],[22,22,24,24,24,28,28,34]];
    
    //constructor
    constructor(OutlandsShards _os)
        public
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        OS = _os;
    }
    
    function explore (uint256 id) 
        public
        returns (uint8 cool, uint8 risk)
    {
        (bytes32 seed, , uint8 anchor) = OS.getShard(id);
        risk = anchorRisk[anchor-1];
        
        bytes32 random = keccak256(abi.encode(address(this), seed, block.timestamp, ++count));
        //return cool for character
        cool = riskCooldown[risk][uint8(random[0])%8];
        
        //set cool for shard 
    }
}


