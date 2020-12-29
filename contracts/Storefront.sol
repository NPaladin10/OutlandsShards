// Storefront.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./CPXToken1155.sol";
import "./Pausable.sol";

/*
    Deployed 
    Goerli 0.1 - 0x2b835d3df0b74E139Cb2ff5Ad6c13CAC13364248 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0xd0BC0e573d1d4255f5e8E5d715E553539678EB76 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.3 - 0x65187296bD4b168B0B3cdaf134c861609B00CC69 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract Storefront1155 is PausableCPX {
    //contracts 
    CPXToken1155 private CPX1155;

    /**
     * @dev SKU cross reference
     * 0 - token ID to pay 
     * 1 - price 
     * 2 - token ID for sale  
     * 3 - token sale quantity
     */
    mapping (uint256 => uint256[4]) internal SKU;
    
    //enable unique tokens 
    struct UniqueToken {
        bool unique;
        uint256 count;
        uint256 max;
    }
    mapping (uint256 => UniqueToken) internal uToken;
    
    //collect seeds for each unique token 
    mapping (uint256 => bytes32) public seeds;
    
    //Events 
    event Bought(address buyer, uint256 when, uint256 sku, uint256 qty); 
    
    //constructor
    constructor(CPXToken1155 _cpx1155)
        public
    {
        CPX1155 = _cpx1155;
    }
    
    /*
        internal functions 
    */
    
    function _mintUnique (address buyer, uint256[4] memory sku, uint256 _qty)
        internal 
    {
        uint256 tid = sku[2];
        require(_qty + uToken[tid].count < uToken[tid].max, "Exceeds total count of unique tokens.");
        
        //loop for unique ids 
        for(uint256 i = 0; i < _qty; i++){
            uint256 _id = ++uToken[tid].count + tid;  

            //seed 
            seeds[_id] = keccak256(abi.encode(address(this), _id, block.timestamp));

            //mint on 1155 
            CPX1155.mint(buyer, _id, 1, abi.encode(seeds[_id]));
        }
    }
    
    function _mint (address buyer, uint256[4] memory sku, uint256 _qty) 
        internal
    {
        uint256 qty = _qty * sku[3];
        uint256 tid = sku[2]; 
        //check for UniqueToken
        if(uToken[tid].unique) {
            _mintUnique(buyer, sku, _qty);
        }
        else {
            //mint on 1155 
            CPX1155.mint(buyer, tid, qty, "");
        }
    }
    
    /*
        view functions 
    */
    
    function getSKU (uint256 _id) 
        public
        view
        returns (uint256[4] memory)
    {
        return SKU[_id];
    }
    
    function getCountOfUnique (uint256 _id) 
        public
        view
        returns (uint256, uint256)
    {
        return (uToken[_id].count, uToken[_id].max);
    }
    
    function isUnique (uint256 _id) 
        public
        view
        returns (bool)
    {
        return uToken[_id].unique;
    }
    
    /*
        admin set functions 
    */
    
    function setContract (CPXToken1155 _cpx1155) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        CPX1155 = _cpx1155;
    }

    function setSKU (uint256 _id, uint256[4] calldata sku)
        public
    {
        //only admin
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        require(sku[0] != 0 && sku[1] != 0, "Invalid SKU.");
        
        //set sku data 
        SKU[_id] = sku;
    }
    
    function setUnique (uint256 id, uint256 max)
        public
    {
        //only admin
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        
        //set unique data - once set cannot be unset  
        uToken[id].unique = true;
        uToken[id].max = max;
    }
    
    /*
        Primary functon 
    */
    
    function buy (uint256 _id, uint256 _qty) 
        public
    {
        //not paused
        require(!CPX1155.paused(), "The store is closed for the moment.");
        require(!_isPaused, "The store is closed for the moment.");
        
        uint256[4] memory sku = SKU[_id];  
        uint256 price = sku[1] * _qty;
        //price must not be 0 
        require (price > 0 && sku[0] > 0, "This is not for sale.");
        
        //must have allowance
        bool allowed = CPX1155.isApprovedForAll(msg.sender, address(this));
        require (allowed, "Please allow contract.");
        
        //burn
        CPX1155.burn(msg.sender, sku[0], price);
        
        //mint token 
        if(sku[3] != 0) _mint(msg.sender, sku, _qty);

        //emit 
        emit Bought(msg.sender, block.timestamp, _id, _qty);
    }
}