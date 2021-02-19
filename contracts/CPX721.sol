// CPX721.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721Holder.sol";

/*
    Deployed 
    Goerli - ShardsV1 - 0xe9FD8F89c0b96eE174197cA3d29F9Dcc684B991F
*/
contract CPX721 is ERC721PresetMinterPauserAutoId {
    // Create roles 
    //0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");
    
    //keeps stats for NFTs - nft, stat id, value   
    mapping (uint256 => mapping (uint256 => int256)) public stats;
    
    /*
        Events 
    */
    event StatChange (address indexed operator, uint256 indexed id, uint256 stat, int256 val);
    event StatChangeBatch (address indexed operator, uint256 indexed id, uint256[] stats, int256[] vals);

    constructor(string memory name, string memory symbol)
        ERC721PresetMinterPauserAutoId(name, symbol, "")
    {}
    
    function setGatekeeper (address gk) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        _setupRole(MINTER_ROLE, gk);
        _setupRole(SETTER_ROLE, gk);
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
    
    function getStatsOfIdBatch (uint256[] calldata ids, uint256 si)
        public
        view 
        returns (int256[] memory vals)
    {
        //set returns
        uint256 l = ids.length;
        vals = new int256[](l);
        //loop
        for(uint256 i = 0; i < l; i++){
            vals[i] = stats[ids[i]][si];
        }
    }
    
    /*
        external 
        Stat control 
    */
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
        for(uint256 i = 0; i < si.length; i++){
            stats[id][si[i]] = _vals[i];
        }
        
        emit StatChangeBatch (msg.sender, id, si, _vals);
    }
}
