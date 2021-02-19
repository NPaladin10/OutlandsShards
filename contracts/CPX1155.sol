// CPXToken1155.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/presets/ERC1155PresetMinterPauser.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155Holder.sol";

/*
    Deployed 
    Goerli - 0x26a96fa88E27fA136cd29C325EA84080C0311f38
*/
contract CPX1155 is ERC1155PresetMinterPauser {

    //adds total balance of tokens
    mapping (uint256 => uint256) internal _totalBalances;

    constructor()
        ERC1155PresetMinterPauser("")
    {}
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal virtual override
    { 
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data); // Call parent hook
        
        //minting
        uint256 l = ids.length;
        uint256 i = 0;
        if(from == address(0)) {
            for(i = 0; i < l; i++){
                _totalBalances[ids[i]] += amounts[i];
            }
        }
        //burning
        if(to == address(0)) {
            for(i = 0; i < l; i++){
                _totalBalances[ids[i]] -= amounts[i];
            }
        }
    }
    
    function setURI (string calldata _uri) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not ADMIN");
        _setURI(_uri);
    }
    
    function getTotalBalanceOf (uint256 id) 
        public view
        returns (uint256 balance)
    {
        return _totalBalances[id];
    }
    
}
