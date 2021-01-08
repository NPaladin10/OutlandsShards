// Characters.sol
// V0.5
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";
import "./OutlandsShards.sol";

/*
    Deployed 
    local 0.2 - 0x1b9aCd0c1C972Ed4dB743c5e55797d2251fD38CB
    local 0.3 - 0x99aB2d91CF69021d51d69b465182F7Da95EaF0db
    local 0.4 - 0x65A1fAAea4a35eBa6B2694b6b7101FE3Dd6B1B16
    local 0.5 - 0xE0C9ee7973A7c734B00cD49DD4E871b53E4DaA4e
    Goerli 0.1 - 0x6Ca442A4F8bAEfAc47e9710641b7F4d6B65Ee8c3 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0xf9b9c3b712334AA91CeAa47bC37202Bb863FddEe (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    
*/
contract Characters is NFTKeeper {
    //data ids 
    uint8 public constant NFT_ID = 0;
    uint8 public constant HOME_ID = 1;
    uint8 public constant LOCATION_ID = 2;
    uint8 public constant COOL_ID = 3;
    
    //array for use later 
    uint256[] internal _statIds = [NFT_ID, HOME_ID, LOCATION_ID, COOL_ID];
    
    // Create a new role identifier for the minter role
    //0xe5ed70e23144309ce456cb48bf5e6d0d8e160f094a6d65ecf1d5b03cf292d8e6
    bytes32 public constant MOVER_ROLE = keccak256("MOVER_ROLE");
    bytes32 public constant COOL_ROLE = keccak256("COOL_ROLE");
    
    //contracts 
    OutlandsShards internal OS;
    
    //Events 
    event Mint(address indexed operator, uint256 indexed what, uint256 id, bytes32 home);
    event Move(uint256 indexed id, bytes32 indexed shard);

    //constructor
    constructor(Gatekeeper gk, OutlandsShards os)
        public
        NFTKeeper(gk, 10**6)
    {
        OS = os;
    }
    
    /*
        Internal Functions 
    */
    
    function _setCool (uint256 id, int256 cool) 
        internal
    {
        GK.setStat(id, COOL_ID, cool);
    }
    
    function _setLocation (uint256 id, bytes32 toShard)
        internal
    {
        //set location 
        GK.setStat(id, LOCATION_ID, int256(toShard));
        emit Move(id, toShard);
    }
    
    function _move (uint256 id, bytes32 toShard)
        internal
    {
        require(!_isPaused, "The contract is paused.");
        require(getCooldown(id) < int256(block.timestamp), "Character is in cooldown.");

        //do the move and get cooldown time
        uint256 _time = OS.getTravelTime(getCurrentLocation(id), toShard) + block.timestamp;

        //set cooldown
        _setCool(id, int256(_time));
        
        //set location
        _setLocation(id, toShard);
    }
    
    /*
        External Admin Functions 
    */
    
    function setContracts (Gatekeeper gk, OutlandsShards os)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        GK = gk;
        OS = os;
    }
    
    /*
        view 
    */ 
    
    function getData (uint256 id)
        public
        view
        returns (uint256 nft, bytes32 home)
    {
        //[NFT_ID, HOME_ID, LOCATION_ID, COOL_ID]
        int256[] memory vals = GK.getStatBatch(id, _statIds);
        return (uint256(vals[0]), bytes32(vals[1]));
    }
    
    function getCurrentLocation (uint256 id) 
        public
        view
        returns (bytes32)
    {
        return bytes32(GK.getStat(id, LOCATION_ID));
    }
    
    //gets the home shard 
    function getHomeData (uint256 _id) 
        public
        view 
        returns (bytes32 seed, int256 r, int256 a, uint256 rare, uint256 id)
    {
        seed = bytes32(GK.getStat(_id, HOME_ID));
        (id, r, a, rare) = OS.getShardBySeed(seed); 
    }
    
    //gets the shard information where the character id is located 
    function getShardData (uint256 _id) 
        public
        view 
        returns (bytes32 seed, int256 r, int256 a, uint256 rare, uint256 id)
    {
        seed = getCurrentLocation(_id);
        (id, r, a, rare) = OS.getShardBySeed(seed); 
    }
    
    function getSeed (uint256 id) 
        public
        view
        returns (bytes32 seed)
    {
        return _getSeed(id);
    }
    
    /*
        COOLDOWN
    
    */
    //players can buy cooldown to reduce the unit cooldown
    uint256[6] private cooldownTokens = [101,102,103,104,105,106];
    uint256[6] private steps = [5 * 1 minutes, 15 * 1 minutes, 1 hours, 3 * 1 hours, 8 * 1 hours, 1 days];
    
    function setCooldownTokens (uint256[6] calldata _tokens) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        cooldownTokens = _tokens;
    }
    
    function setCooldownSteps (uint256[6] calldata _steps) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        steps = _steps;
    }
    
    function spendTokens (uint256 id, uint256 ti, uint256 qty) 
        public
    {
        require(!_isPaused, "The contract is paused.");
        require (ti < cooldownTokens.length, "Incorrect token.");
        //must be greater than time
        int256 _cool = getCooldown(id);
        int256 _time = int256(steps[ti] * qty);
        require(_cool > _time, "Cooldown past time.");
        //require approval 
        address player = msg.sender;
        require(GK.balanceOf(player, cooldownTokens[ti]) >= qty, "You don't have the tokens.");
        
        //burn
        GK.burn(msg.sender, cooldownTokens[ti], qty);
        
        //reduce cooldown
        _setCool(id, _cool-_time);
    }
    
    function getCooldown (uint256 id) 
        public
        view
        returns (int256)
    {
        return GK.getStat(id, COOL_ID);
    }
    
    function setCooldown (uint256 id, int256 cool) 
        public 
    {
        require(hasRole(COOL_ROLE, msg.sender), "No permission.");
        
        //set cooldown
        _setCool(id, cool);
    }
    
    function setCooldownBatch (uint256[] calldata ids, int256[] calldata cool) 
        public 
    {
        require(hasRole(COOL_ROLE, msg.sender), "Caller is not authorized.");
        
        for(uint256 i = 0; i < ids.length; i++) {
            //set cooldown
            _setCool(ids[i], cool[i]);
        }
    }
    
    /*
        Functions for players to move their character 
    */
    
    function move (uint256 id, bytes32 toShard) 
        public
    {
        //check for ownership 
        require(GK.isOwnerOf(msg.sender, id), "You do not own the character.");
        
        //move 
        _move(id, toShard);
    }
    
    function moveBatch (uint256[] calldata ids, bytes32 toShard) 
        public
    {
        //loop 
        for(uint256 i = 0; i < ids.length; i++) {
            move(ids[i], toShard);
        }
    }
    
    //External call for other contracts to move character 
    function moveFor (uint256 id, bytes32 toShard, bool useCooldown) 
        public
    {
        require(hasRole(MOVER_ROLE, msg.sender), "No permission.");
        
        if(useCooldown) {
            _move(id, toShard);
        }
        else {
            //set location
            _setLocation(id, toShard);
        }
    }
    
    /*
        mint function 
    */
    
    function mint (uint256 id, bytes calldata data) 
        public
        override
        returns (bytes memory)
    {
        require(!_isPaused, "Contract is paused.");
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        //decode data 
        uint256 nftId = GK.getNFTId(id);
        bytes32 home;
        (uint256 finder) = abi.decode(data, (uint256));
        
        if(nftId != 10**6) {
            //mint - standard character 
            require(GK.isOwnerOf(msg.sender, finder), "You do not own the character.");
            home = getCurrentLocation(finder);
        }
        else {
            //mint agent - agents don't require a finder 
            home = bytes32(finder);
        }

        //set home 
        GK.setStat(id, HOME_ID, int256(home));
        
        //set location 
        _setLocation(id, home);
        
        emit Mint(msg.sender, nftId, id, home);
        
        //data 
        return data;
    }
}