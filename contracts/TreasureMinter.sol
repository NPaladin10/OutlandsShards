// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Pausable.sol";
import "./CPXToken1155.sol";

/*
    Deployed 
    Goerli 0.1 0xb6A53a4852d8A1978fC4c61c1618E576b8b78d2b -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract TreasureMinter is PausableCPX {
    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    //contracts 
    CPXToken1155 internal CPX1155;

    //treasure matrix
    mapping (uint256 => uint256[2]) internal treasureIndex;
    
    //allowable treasure tokens 
    mapping (uint256 => bool) public allowableTokens; 

    //Events
    event SentTreasure (address operator, address player, uint256[] ids);

    //constructor
    constructor(CPXToken1155 _cpx1155)
        public
    {
        CPX1155 = _cpx1155;
    }
    
    /*
        internal functions 
    */
    
    //check if the token can be minted 
    function _allowed (uint256 id) 
        internal
        view
    {
        require(allowableTokens[id], "Token is not allowed.");
    }
    
    /*
        view 
    */
    function getTreasure (uint256[] calldata ids) 
        public
        view
        returns (uint256[2][] memory treasure)
    {
        uint256 l = ids.length;
        treasure = new uint256[2][](l);
        
        for(uint256 i = 0; i < l; i++){
            treasure[i] = treasureIndex[ids[i]];
        }
    }

    /*
        external admin functions 
    */
    function setContract (CPXToken1155 _cpx1155)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        CPX1155 = _cpx1155;
    }
    
    function setAllowableTokens (uint256[] calldata ids, bool[] calldata allow)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        uint256 l = ids.length;
        require(l == allow.length, "Must be the same length.");
        
        //set allowable
        for(uint256 i = 0; i < l; i++) {
            allowableTokens[ids[i]] = allow[i];
        }
    }
    
    function setTreasureBatch (uint256[] calldata ids, uint256[2][] calldata treasure)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        uint256 l = ids.length;
        require(l == treasure.length, "Must be the same length.");
        
        //set treasure
        for(uint256 i = 0; i < l; i++) {
            //check that the treasure is allowed 
            _allowed(treasure[i][0]);
            
            //set tresure
            treasureIndex[ids[i]] = treasure[i];
        }
    }
    
    /*
        external mint 
    */
    
    function mint (address player, uint256[] calldata ids) 
        public
    {
        //Check for pause and role 
        require(!_isPaused, "This contract is paused.");
        require(!CPX1155.paused(), "1155 contract is paused.");
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");

        //mint each id 
        uint256 l = ids.length;
        uint256[] memory tids = new uint256[](l);
        uint256[] memory vals = new uint256[](l);
        uint256[2] memory T;
        
        for(uint256 i = 0; i < l; i++){
            //set current treasure
            T = treasureIndex[ids[i]];
            _allowed(T[0]);

            //add to mint    
            tids[i] = T[0];
            vals[i] = T[1];
        }

        //mint batch 
        CPX1155.mintBatch(player, tids, vals, "");
        
        //emit 
        emit SentTreasure(msg.sender, player, ids);
    }
}

//Giver of treasure
contract TreasureGiver is PausableCPX {
    //contracts 
    TreasureMinter internal TM;

    mapping (uint256 => uint256[]) internal treasureLists;
    
    uint256 internal count;

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
    
    /*
        Call to give a player a set of treasure from a list
        nT, array of numbers of treasure to give 
    */  
    function _generateTreasure (address player, uint256 _list, uint8[8] memory nT)
        internal
    {
        //relative randomness
        bytes32 seed = keccak256(abi.encode(address(this), ++count, block.timestamp));
        
        //get treasure list data 
        uint256[] memory list = treasureLists[_list];
        uint256 l = list.length;
        
        //determine the number of treasures to give 
        uint8 n = nT[uint256(seed) % 8];

        //loop through and randomly pick from the list
        uint256[] memory treasure = new uint256[](n);
        uint256 _id;
        for(uint8 i = 0; i < n; i++){
            _id = uint256(keccak256(abi.encode(seed,i))) % l; 
            treasure[i] = list[_id]; 
        }
        
        //mint 
        TM.mint(player, treasure);
        
        //emit 
        GaveTreasure(player, treasure);
    }
    
    /*
        admin set 
    */
    function setList (uint256 id, uint256[] calldata tids)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        treasureLists[id] = tids;
        
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
        return treasureLists[id];
    }
}

//Daily minter 
contract DailyTreasure is TreasureGiver {
    //number of treasures to be generated 
    uint8[8] nT = [1,1,1,1,2,2,2,3];
    //last time treasure was accessed
    mapping (address => uint256[3]) public lastTreasure;
    
    //treasure times 
    uint256[3] public treasureTimes = [22 * 1 hours, 4 * 1 hours, 10 * 1 minutes];
    
    //constructor
    constructor(TreasureMinter _tm)
        public
        TreasureGiver(_tm)
    {}
    
    function _init (address player) 
        internal
    {
        //always give new players an initial treasure 
        uint256[] memory startingTreasure = new uint256[](2);
        startingTreasure[0] = 3001;
        startingTreasure[1] = 3001;
        
        //mint 
        TM.mint(player, startingTreasure);
    }
    
    function getTreasure (uint256 i) 
        public
    {
        address player = msg.sender;
        uint256 _now = block.timestamp; 
        uint256 dT = _now - lastTreasure[player][i];
        require(dT > treasureTimes[i], "Have not waited long enough.");
        
        //check for initial 
        if(i == 0 && lastTreasure[player][i] == 0) {
            _init(player);
        }
        
        //set new time 
        lastTreasure[player][i] = _now;
        
        //generate 
        _generateTreasure(player, i, nT);
    }
}