pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

contract OutlandsXP is MinterRole{
    using SafeMath for uint256;
    //tracks XP given and expended 
    mapping (uint256 => uint256) public totalXP;
    mapping (uint256 => uint256) internal usedXP;
    //core data 
    address payable admin;

    constructor() public {
        admin = msg.sender;
    }
    
    /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
        //destroy
        selfdestruct(admin);
    }
    
    /**
     * @dev Returns the XP of a hero 
     * Total and active 
     */
    function activeXP(uint256 id) public view returns(uint256, uint256) {
        return (totalXP[id], totalXP[id].sub(usedXP[id]));
    }
    
    /**
     * @dev Gives a hero xp  
     */
    function _giveXP(uint256 id, uint256 xp) internal {
        totalXP[id] = totalXP[id].add(xp);
    }
    function giveXPSingle(uint256 id, uint256 xp) public onlyMinter  {
        _giveXP(id,xp);
    }
    function giveXPArray(uint256[] memory ids, uint256[] memory xp) public onlyMinter {
        require(ids.length == xp.length);
        uint256 n = ids.length;
        for(uint256 i = 0; i < n; i++){
            _giveXP(ids[i], xp[i]);
        }
    }
    
    /**
     * @dev Uses a heroe's xp
     */
    function useXP(uint256[] memory ids, uint256[] memory xp) public onlyMinter {
        require(ids.length == xp.length);
        uint256 n = ids.length;
        uint256 _id;
        for(uint256 i = 0; i < n; i++){
            _id = ids[i];
            usedXP[_id] = usedXP[_id].add(xp[_id]);
        }
    }
}
