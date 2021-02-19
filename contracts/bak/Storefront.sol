/*
    Storefront.sol
    V0.5
    SPDX-License-Identifier: MIT
*/ 
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";

/*
    Deployed 
    local 0.4 - 0x080e6904f51BFf1E4d231d9aA7A2aCC28A0Eb980
    Goerli 0.1 - 0x2b835d3df0b74E139Cb2ff5Ad6c13CAC13364248 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0xd0BC0e573d1d4255f5e8E5d715E553539678EB76 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.3 - 0x65187296bD4b168B0B3cdaf134c861609B00CC69 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.4 - 0x6781b3215492B87fd90669719595E8bc3d0eE20A (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract Storefront1155 is PausableCPX {
    //contracts 
    Gatekeeper private GK;

    /**
     * @dev SKU cross reference
     * 0 - token ID to pay 
     * 1 - price 
     * 2 - token ID for sale  
     * 3 - token sale quantity
     * 4 - call NFT contract address
     */
    struct SKUData {
        uint256[] priceIds;
        uint256[] priceAmts;
        uint256[] ids;
        uint256[] amounts;
        address NFTKeeper;
    }
    mapping (uint256 => SKUData) internal _SKU;

    //some SKUs can have a lock 
    mapping (uint256 => uint256[2]) internal _lock;

    //Events 
    event Bought(address indexed buyer, uint256 when, uint256 indexed sku, uint256 qty); 
    
    //constructor
    constructor(Gatekeeper gk)
        public
    {
        GK = gk;
    }
    
    /*
        internal functions 
    */
    
    function _hasTokens (address player, uint256[] memory priceIds, uint256[] memory priceAmts) 
        internal
        view
    {
        for(uint256 i = 0; i < priceIds.length; i++) {
            require(GK.balanceOf(player, priceIds[i]) >= priceAmts[i], "Not enough tokens to buy.");
        }
    }
    
    /*
        admin set functions 
    */
    
    function setContract (Gatekeeper gk) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        GK = gk;
    }

    function setSKU (uint256 id, uint256[] calldata priceIds, uint256[] calldata priceAmts, uint256[] calldata ids, uint256[] calldata amounts, address nft)
        public
    {
        //only admin
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");

        //validate prices 
        for(uint256 i = 0; i < priceIds.length; i++){
            require(priceIds[i] != 0 && priceAmts[i] != 0, "Token cost not allowed.");
        }
        
        //set sku data 
        _SKU[id] = SKUData(priceIds, priceAmts, ids, amounts, nft);
    }
    
    function setLock (uint256 id, uint256[2] calldata lockData) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        _lock[id] = lockData;
    }
    
    /*
        view functions 
    */
    
    function getSKU (uint256 id) 
        public
        view
        returns (uint256[] memory priceIds, uint256[] memory priceAmts, uint256[] memory ids, uint256[] memory amounts)
    {
        priceIds = _SKU[id].priceIds;
        priceAmts = _SKU[id].priceAmts;
        ids = _SKU[id].ids;
        amounts = _SKU[id].amounts;
    }
    
    function getLocks (uint256[] calldata _ids) 
        public
        view
        returns (uint256[] memory ids, uint256[] memory values)
    {
        uint256 l = _ids.length;
        ids = new uint256[](l);
        values = new uint256[](l);
        
        for(uint256 i = 0; i < l; i++){
            ids[i] = _lock[_ids[i]][0];
            values[i] = _lock[_ids[i]][1];
        }
    }
    
    function isUnlocked (address player, uint256 id)
        internal
        view
        returns (bool)
    {
        if(_lock[id][0] == 0) return true;
        else return GK.balanceOf(player, _lock[id][0]) >= _lock[id][1];
    }
    
    function isUnlockedBatch (address player, uint256[] memory ids) 
        public
        view
        returns (bool[] memory unlocked)
    {
        uint256 l = ids.length;
        unlocked = new bool[](l);

        //loop through checking locks 
        for(uint256 i = 0; i < l; i++){
            unlocked[i] = isUnlocked(player, ids[i]);
        }
    }
    
    /*
        Primary functon 
    */

    function buy (uint256 id, uint256 qty, bytes calldata data) 
        public
    {
        //not paused
        require(!GK.paused(), "The store is closed for the moment.");
        require(!_isPaused, "The store is closed for the moment.");
        
        SKUData memory sku = _SKU[id];
        //has data 
        require(sku.priceIds.length > 0, "SKU not for sale.");
        
        address player = msg.sender;
        //loop through for qty 
        for(uint256 i = 0; i < qty; i++) {
            //require tokens 
            _hasTokens(player, sku.priceIds, sku.priceAmts);
            
            //check if unlocked
            require(isUnlocked(player, id), "Item is locked.");
    
            //burn
            GK.burnBatch(player, sku.priceIds, sku.priceAmts);
            
            //mint token 
            if(sku.NFTKeeper == address(0)) {
                //fungible
                GK.mintBatch(player, sku.ids, sku.amounts);
            }
            else {
                //NFT
                GK.mintNFT(player, sku.ids[0], sku.NFTKeeper, data);
            }
        }

        //emit 
        emit Bought(msg.sender, block.timestamp, id, qty);
    }
}