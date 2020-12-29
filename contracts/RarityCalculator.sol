// CharacterForge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";

/*
    Deployed 
    Local 0.1 - 0xd4BAaD2477917664Ecd4C85E03eE3aFd209b7893
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