// CPXToken721.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721Holder.sol";

/*
    Deployed 
*/
contract CPXToken721 is ERC721PresetMinterPauserAutoId {
    // Create roles 
    //0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");
    
    //keeps stats for NFTs - nft, stat id, value   
    mapping (uint256 => mapping (uint256 => int256)) public stats;
    
    //cost to mint 
    uint256 public cost;

    /*
        Events 
    */
    event StatChange (address indexed operator, uint256 indexed id, uint256 stat, int256 val);
    event StatChangeBatch (address indexed operator, uint256 indexed id, uint256[] stats, int256[] vals);
    event Withdrawn(address indexed payee, uint256 weiAmount);

    constructor(string memory name, string memory symbol)
        ERC721PresetMinterPauserAutoId(name, symbol, "")
    {
        _setupRole(MINTER_ROLE, address(this));
        _setupRole(SETTER_ROLE, address(this));
    }
    
    /*
        Admin withdraws funds from contract
    */
    function withdraw() 
        public 
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        //get balance of contract
        uint256 bal = address(this).balance;
        //set payable 
        address payable payee = payable(msg.sender);
        //send to payee
        payee.transfer(bal);
        //emit 
        emit Withdrawn(msg.sender, bal);
    }
    
    function setCost (uint256 _cost) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        cost = _cost;
    }
    
    function setURI (string calldata _uri) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        _setBaseURI(_uri);
    }
    
    /*
        view functions for unique token data  
    */

    function getStat (uint256 id, uint256 i) 
        public
        view
        returns (int256 val)
    {
        return stats[id][i];
    }
    
    function getStatBatch (uint256 id, uint256[] calldata si)
        public
        view 
        returns (int256[] memory vals)
    {
        //set returns
        vals = new int256[](si.length);
        //loop
        for(uint256 i = 0; i < si.length; i++){
            vals[i] = stats[id][si[i]];
        }
    }
    
    function getStatsOfBatch (uint256[] calldata ids, uint256[] calldata si)
        public
        view 
        returns (int256[] memory vals)
    {
        //set returns
        uint256 l = si.length;
        vals = new int256[](ids.length * si.length);
        //loop
        for(uint256 i = 0; i < ids.length; i++){
            for(uint256 j = 0; j < si.length; j++) {
                vals[j + (l * i)] = stats[ids[i]][si[j]];
            }
        }
    }
    
    /*
        external 
        Stat control 
    */
    function _setStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals)
        internal 
    {
        for(uint256 i = 0; i < si.length; i++){
            stats[id][si[i]] = _vals[i];
        }
        
        emit StatChangeBatch (msg.sender, id, si, _vals);
    }
    
    function setStat (uint256 id, uint256 i, int256 val) 
        public
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        stats[id][i] = val;
        
        emit StatChange (msg.sender, id, i, val);
    }
    
    function setStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals) 
        public
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        _setStatBatch(id, si, _vals);
    }
    
    function modStat (uint256 id, uint256 i, int256 val) 
        public
        returns (int256)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        stats[id][i] += val;
        
        emit StatChange (msg.sender, id, i, stats[id][i]);
        return stats[id][i];
    }
    
    function modStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals) 
        public
        returns (int256[] memory vals)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        
        //init return 
        uint256 l = si.length;
        vals = new int256[](l);
        
        for(uint256 i = 0; i < l; i++){
            //set stat 
            stats[id][si[i]] += _vals[i];
            
            //set return
            vals[i] =  stats[id][si[i]];
        }
        
        emit StatChangeBatch (msg.sender, id, si, vals);
    }
    
    /*
        Mint 
        freedom to allow players to mint as long as they pay the cost
        provide the initial stats for making the nft unique 
    */ 
    
    function mintNFT (uint256[] calldata si, int256[] calldata _vals) 
        public
        payable
    {
        require(msg.value >= cost, "Must pay to mint.");
        
        //call mint 
        mint(msg.sender);
        uint256 _id = totalSupply() - 1;
        //set stats
        _setStatBatch(_id, si, _vals);
    }
}
