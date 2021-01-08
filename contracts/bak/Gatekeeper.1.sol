// Storefront.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./CPXToken1155.sol";
import "./Pausable.sol";

/*
    Deployed 
    Local 0.1 - 0xCD8899dc6Ea7542a1c97C9B71ac4AbC8E91Df471
    Goerli 0.1 0xF988ea224f4Dd6F73d4857D32C1F43375E7b15c4 -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/

contract Gatekeeper is PausableCPX {
    // Create a new role identifier for the minter role
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // Create a new role identifier for the burner role 
    //0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    //contracts 
    CPXToken1155 internal CPX1155;
    
    //enable NFT 
    struct NFTData {
        uint256 count;
        uint256 max;
    }
    mapping (uint256 => NFTData) internal _NFT;
    
    //collect seeds for each NFT  
    mapping (uint256 => bytes32) public seeds;

    //constructor
    constructor(CPXToken1155 _cpx1155)
        public
    {
        CPX1155 = _cpx1155;
    }
    
    /*
        1155 functions 
        balanceOf(account, id)
        balanceOfBatch(accounts, ids)
        mint(to, id, amount, data)
        mintBatch(to, ids, amounts, data)
        burn(account, id, value)
        burnBatch(account, ids, values)
    */
    
    /*
        internal checks 
    */
    
    function _hasNFT (uint256[] calldata ids) 
        internal
        view
        returns (bool hasNFT)
    {
        for(uint256 i = 0; i < ids.length; i++) {
            hasNFT = hasNFT || _NFT[ids[i]].max > 0;
        }
    }

    /*
        internal calls to 1155 mint functions 
        used by external mint function 
    */
    
    function _mint (address to, uint256 id, uint256 amount) 
        internal
    {
        CPX1155.mint(to, id, amount, "");
    }
    
    function _mintNFT (address to, uint256 id, uint256 qty) 
        internal
    {
        NFTData memory nft = _NFT[id];
        require(nft.count + qty < nft.max, "Exceeds max allowance of NFT.");
        
        uint256 _id; 
        for(uint256 i = 0; i < qty; i++){
            _id = ++_NFT[id].count + id;  

            //seed 
            seeds[_id] = keccak256(abi.encode(address(this), _id, block.timestamp));

            //mint on 1155 
            CPX1155.mint(to, _id, 1, abi.encode(seeds[_id]));
        }
    }
    
    function _mintBatch (address to, uint256[] calldata ids, uint256[] calldata amounts) 
        internal
    {
        CPX1155.mintBatch(to, ids, amounts, "");
    }
    
    /*
        admin functions 
    */
    
    function setNFT (uint256 id, uint256 max)
        public
    {
        //only admin
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        
        //set NFT max  
        _NFT[id].max = max;
    }
    
    /*
        external view functions to pass on 1155 data 
        contracts only need to reference this contrct, not both 
    */
    
    function balanceOf (address account, uint256 id)
        public
        view
        returns (uint256)
    {
        return CPX1155.balanceOf(account,id);
    }
    
    function balanceOfBatch (address[] calldata accounts, uint256[] calldata ids)
        public
        view
        returns (uint256[] memory)
    {
        return CPX1155.balanceOfBatch(accounts, ids);
    }
    
    /*
        view functions for unique token data  
    */
    
    function isNFT (uint256 id) 
        public
        view
        returns (bool)
    {
        return _NFT[id].max > 0; 
    }
    
    function getCountOfNFT (uint256 id) 
        public
        view
        returns (uint256, uint256)
    {
        return (_NFT[id].count, _NFT[id].max);
    }
    
    /*
        external mint and burn functions 
        single point of interface 
    */
    
    function burnBatch (address player, uint256[] calldata ids, uint256[] calldata amounts) 
        public
    {
        require(hasRole(BURNER_ROLE, msg.sender), "No permission.");
        CPX1155.burnBatch(player, ids, amounts);
    }
    
    function burn (address player, uint256 id, uint256 amount) 
        public
    {
        require(hasRole(BURNER_ROLE, msg.sender), "No permission.");
        CPX1155.burn(player, id, amount);
    }
    
    function mintBatch (address player, uint256[] calldata ids, uint256[] calldata amounts) 
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        require(!_hasNFT(ids), "Cannot mint batch of NTFs.");
        
        _mintBatch(player, ids, amounts);
    }
    
    function mint (address player, uint256[] calldata ids, uint256[] calldata amounts) 
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        uint256 l = ids.length;
        require (l == amounts.length, "Array mismatch.");
        
        //loops through to check for NFTs
        for(uint256 i = 0; i < l; i++){
            if(isNFT(ids[i])) {
                //mint NFT
                _mintNFT(player, ids[i], amounts[i]);
            }
            else {
                //mint standard
                _mint(player, ids[i], amounts[i]);
            }
        }
    }
}