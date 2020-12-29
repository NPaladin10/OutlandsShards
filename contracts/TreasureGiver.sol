// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./TreasureMinter.sol";

//Giver of treasure
contract TreasureGiver is PausableCPX {
    //contracts 
    TreasureMinter internal TM;

    //core lists of treasure 
    mapping (uint256 => uint256[]) internal _treasureLists;

    /*
        Handles giving treasure based upon a limited claim period
    */ 
    //treasure claim 
    mapping (bytes32 => bool) internal _hasClaimed;
    
    //sometimes claims on a list are limited by a period of time 
    mapping (uint256 => uint256) internal _claimPeriod;

    /*
        counter for semi-randomness for generator 
    */ 
    uint256 internal _count;

    //Events
    event GaveTreasure (address player, uint256[] tids);
    event ListSet (uint256 li, uint256[] tids);

    //constructor
    constructor(TreasureMinter _tm)
        public
    {
        TM = _tm;
    }
    
    /*
        internal function
    */
    
    function _mint (address player, uint256[] memory treasure) 
        internal
    {
        //mint 
        TM.mint(player, treasure);
        
        //emit 
        GaveTreasure(player, treasure);
    }
    
    /*
        functions for limited claims 
    */
    
    function _playerTreasureId (address player, uint256 id) 
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(player, id));
    }
    
    function _claimLimited (address player, uint256 id) 
        internal
    {
        //player treasure id 
        bytes32 pId = _playerTreasureId(player, id);
        //make the checks 
        require(!_hasClaimed[pId], "Treasure already claimed.");
        require(_claimPeriod[id] == 0 || block.timestamp < _claimPeriod[id], "Time expired to claim.");
        
        //passed all tests - set claim  
        _hasClaimed[pId] = true;
    }
    
    /*
        Call to give a player a set of treasure from a list
        nT, array of numbers of treasure to give 
    */  
    function _generateTreasure (uint256[] memory list, uint8[] memory nT)
        internal
        returns (uint256[] memory treasure)
    {
        require(list.length > 0 && nT.length > 0, "Invalid list and number array.");
        //relative randomness
        bytes32 seed = keccak256(abi.encode(address(this), ++_count, block.timestamp));
        
        //get treasure list data 
        uint256 l = list.length;
        
        //determine the number of treasures to give 
        uint8 n = nT[uint256(seed) % nT.length];

        //loop through and randomly pick from the list
        treasure = new uint256[](n);
        uint256 _id;
        for(uint8 i = 0; i < n; i++){
            _id = uint256(keccak256(abi.encode(seed,i))) % l; 
            treasure[i] = list[_id]; 
        }
    }
    
    /*
        view to tell if treasure was claimed 
    */
    
    function hasClaimedTreasure (address player, uint256 id) 
        public
        view
        returns (bool)
    {
        return _hasClaimed[_playerTreasureId(player, id)];
    }
    
    /*
        admin set 
    */
    
    function setClaimPeriod (uint256 id, uint256 dT)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _claimPeriod[id] = block.timestamp + dT;
    }
    
    function setList (uint256 id, uint256[] calldata tids)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _treasureLists[id] = tids;
        
        //emit 
        ListSet(id, tids);
    }
    
    function setContract (TreasureMinter _tm)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        TM = _tm;
    }
    
    /*
        views  
    */
    function getTreasureList (uint256 id) 
        public
        view
        returns (uint256[] memory list)
    {
        return _treasureLists[id];
    }
}

/*
    Deployed 
    Local 0.1 - 0x4ED298E8b9576953810737D2aC0D245FB87d3Dd6
    Goerli 0.1 0x7BE9E681D3733F583e827B19942259Cafa7370CA -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/

//Daily minter 
contract DailyTreasure is TreasureGiver {
    //number of treasures to be generated 
    uint8[] nT = [1,1,1,1,2,2,2,3];
    //last time treasure was accessed
    mapping (address => uint256[3]) public lastTreasure;
    
    //treasure times 
    uint256[3] public treasureTimes = [22 * 1 hours, 4 * 1 hours, 10 * 1 minutes];
    
    //constructor
    constructor(TreasureMinter _tm)
        public
        TreasureGiver(_tm)
    {}
    
    /*
        FreeTreasure
    */
    
    function getFreeTreasure (uint256 id) 
        public
    {
        require(id > 2 && _treasureLists[id].length > 0, "No treasure to claim.");
        //check and claim 
        _claimLimited(msg.sender, id);
        
        //now claim 
        _mint(msg.sender, _treasureLists[id]);
    }
    
    /*
        DailyTreasure call 
    */
    
    function getDailyTreasure (uint256 id) 
        public
    {
        require(id < 3, "Not a daily treasure.");
        address player = msg.sender;
        uint256 _now = block.timestamp; 
        uint256 dT = _now - lastTreasure[player][id];
        require(dT > treasureTimes[id], "Have not waited long enough.");

        //set new time 
        lastTreasure[player][id] = _now;
        
        //generate & mint 
        _mint(player, _generateTreasure(_treasureLists[id], nT));
    }
}   