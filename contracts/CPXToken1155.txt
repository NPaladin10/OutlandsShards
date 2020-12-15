// CPXToken1155.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/presets/ERC1155PresetMinterPauser.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155Holder.sol";

/*
    Deployed 
    Goerli 0.1 - 0x35B833E98088E266F7b5aB85B9f32662Df569f88 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x753606cde5dd3EdD7995d9080020D5281a8C4956 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract CPXToken1155 is ERC1155PresetMinterPauser {

    //adds total balance of tokens
    mapping (uint256 => uint256) internal _totalBalances;

    constructor()
        public
        ERC1155PresetMinterPauser("https://game.example/api/item/{id}.json")
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
                _totalBalances[ids[i]] = _totalBalances[ids[i]].add(amounts[i]);
            }
        }
        //burning
        if(to == address(0)) {
            for(i = 0; i < l; i++){
                _totalBalances[ids[i]] = _totalBalances[ids[i]].sub(amounts[i]);
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
