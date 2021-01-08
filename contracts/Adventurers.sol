/*
    Adventurers.sol
    V0.1
    SPDX-License-Identifier: MIT
*/ 
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";

/*
    deployed
    local v0.1 - 0x104c4755FfA1D5E51be39C35ad500DDB123C0880

*/

contract Adventurers is PausableCPX {
    //Contract reference 
    Gatekeeper internal GK; 
    
    constructor (Gatekeeper gk)
        public 
    {
        GK = gk;
    }
    
    function setContract (Gatekeeper gk) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        GK = gk;
    }
    
    /*
        internal 
    */
    
    //random d6 based upon seed and index 
    function _d6 (bytes32 seed, uint8 i) 
        public 
        pure
        returns (uint8)
    {
        return 1 + (uint8(seed[i]) % 6);
    }
    
    //creates an Adventurer based upon a seed 
    function _bytesToId (bytes32 seed) 
        internal
        pure
        returns (uint256 id)
    {
        id = 1000 + _d6(seed,0);
        
        // 1 in 16 have two skills 
        if((uint8(seed[1]) % 16) == 0) {
            id += _d6(seed,2) * 10; 
            
            //1 in 1000 have three skills 
            if((uint8(seed[3]) % 64) == 0) {
                id += _d6(seed,4) * 100;
            }
        }
    }
    
    //cost based upon the number of skills 
    function _cost (uint256[3] memory split) 
        internal
        pure
        returns (uint256 c)
    {
        c = split[0] > 0 ? 10**19 : split[1] > 0 ? 10**18 : 10**17;  
    }
    
    /*
        link Adventurer to Explorer
    */
    function link (uint256 exId, uint256[] calldata advIds) 
        public
    {
        require(!_isPaused, "Paused.");
        
        uint256 l = advIds.length;
        uint256[] memory _uOnes = new uint256[](l);
        int256[] memory _iOnes = new int256[](l);
        
        for(uint256 i = 0; i < advIds.length; i++) {
            require(advIds[i] > 1000 && advIds[i] < 1700, "Wrong ID.");
            
            _uOnes[i] = 1;
            _iOnes[i] = 1;
        }
        
        //burn 
        GK.burnBatch(msg.sender, advIds, _uOnes);
        
        //link = mod  
        GK.modStatBatch(exId, advIds, _iOnes);
    }
    
    function unlink (uint256 exId, uint256[] calldata advIds) 
        public
    {
        require(!_isPaused, "Paused.");
        
        uint256 l = advIds.length;
        uint256[] memory _uOnes = new uint256[](l);
        int256[] memory _iOnes = new int256[](l);
        
        for(uint256 i = 0; i < advIds.length; i++) {
            require(advIds[i] > 1000 && advIds[i] < 1700, "Wrong ID.");
            
            _uOnes[i] = 1;
            _iOnes[i] = -1;
        }
        
        //unlink = mod  
        GK.modStatBatch(exId, advIds, _iOnes);
        
        //mint 
        GK.mintBatch(msg.sender, advIds, _uOnes);
    }
    
    /*
        Interaction with the contract 
    
    */
    //splits an id into its skills 
    function idSplit (uint256 id)
        public
        pure
        returns (uint256[3] memory s)
    {
        s[0] = (id % 1000)/100; // hundreds
        s[1] = (id % 100)/10; // tens 
        s[2] = id % 10; // units
    }
    
    //claim an Adventurer based upon a provided seed 
    function mint (bytes32 seed) 
        public 
        returns (uint256 id) 
    {
        require(!_isPaused, "Paused.");
        
        id = _bytesToId(seed);
        address player = msg.sender;
        
        //burn cost
        GK.burn(player, 1, _cost(idSplit(id)));
        
        //mint 
        GK.mint(player, id, 1);
    }
}