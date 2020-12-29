// ShardForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";


//ether  1000000000000000000

/*
    Deployed 
    local 0.2 - 0xa5Bb27eA134A5d69621b6e4dBdB1807686BC44E7
    Goerli 0.1 0xb6A53a4852d8A1978fC4c61c1618E576b8b78d2b -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 0x47033640766f9fe1Dac22a8EBB9595b3e764B73a -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract TreasureMinter is PausableCPX {
    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    //contracts 
    Gatekeeper internal GK;

    //treasure matrix
    mapping (uint256 => uint256[2]) internal treasureIndex;
    
    //allowable treasure tokens 
    mapping (uint256 => bool) public allowableTokens; 

    //Events
    event SentTreasure (address operator, address player, uint256[] ids);

    //constructor
    constructor(Gatekeeper gk)
        public
    {
        GK = gk;
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
    function setContract (Gatekeeper gk)
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        GK = gk;
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
        require(!GK.paused(), "1155 contract is paused.");
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
        GK.mintBatch(player, tids, vals);
        
        //emit 
        emit SentTreasure(msg.sender, player, ids);
    }
}