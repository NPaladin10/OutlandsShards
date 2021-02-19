/*
    RarityCalculator.sol
    v0.2
    
    SPDX-License-Identifier: MIT
*/
pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";

/*
    Deployed 
    Local 0.1 - 0xd4BAaD2477917664Ecd4C85E03eE3aFd209b7893
    Goerli 0.1 - 0x6c7AE89b23B1cF1023d2a04DfbA2F3141249662E (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract RarityCalculator is AccessControl {

    //keeps the steps of rarity for calculation 
    mapping (uint256 => uint256[]) internal _rarityIndex;
    
    //constructor
    constructor()
        public
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        //sets up core rarity 
        _rarityIndex[1] = [410,717,922,1023];
    }
    
    /*
        internal 
        functions for generation  
    */
    
    function _bytesSlicer (bytes32 data, uint256 start, uint256 end)
        internal
        pure
        returns (bytes memory slice)
    {
        uint256 l = end-start;
        slice = new bytes(l);
        for(uint256 i = start; i < end; i++){
            slice[i-start] = data[i];
        }
    }
    
    function _bytesToUint (bytes memory b) 
        internal
        pure
        returns (uint256)
    {
        uint256 number;
        for(uint i=0;i<b.length;i++){
            number = number + uint8(b[i])*(2**(8*(b.length-(i+1))));
        }
        return number;
    }
    
    //make the calculation 
    function _rarity (bytes32 seed, uint256 i, uint256 start, uint256 stop) 
        internal
        view
        returns (uint256 value)
    {
        require(stop < 32, "Out of bounds.");
        
        //pull max 
        uint256[] memory _r = _rarityIndex[i]; 
        uint256 l = _r.length;
        uint256 max = _r[l-1] + 1; 
        
        //check for sufficient range 
        require(max < 256**(stop-start), "Insufficient sample range.");
        
        uint256 sliced = _bytesToUint(_bytesSlicer(seed, start, stop));
        uint256 reduced = sliced % max;
        value = l+1;
        
        for(uint256 j = 0; j < l; j++){
            if(reduced < _r[j]) {
                value = i+1;
                break; 
            }
        }

        return value;
    }
    
    /*
        Set Functions for internal data   
    */
    
    function setRarity (uint256 id, uint256[] calldata steps) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not allowed.");
    
        _rarityIndex[id] = steps;
    }
    
    /*
        View functions internal variables  
    */
    
    function getRarityIndex (uint256 id) 
        public
        view
        returns (uint256[] memory steps)
    {
        return _rarityIndex[id];
    }
    
    /*
        external calls 
    */
    
    function getRarity (bytes32 seed, uint256 i, uint256 start, uint256 stop)
        public
        view
        returns (uint256)
    {
        return _rarity(seed, i, start, stop);
    }
}