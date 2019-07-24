pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
* @dev 
* 
*/

contract OutlandsUnitStatus is MinterRole{
    using SafeMath for uint256;
    //tracks XP given and expended 
    mapping (uint256 => uint256) public totalXP;
    mapping (uint256 => uint256) internal usedXP;
    //tracks Cooldown 
    mapping (uint256 => uint256) public cool;
    //tracks status - max of 12 status
    mapping (uint256 => uint8[12]) public status;
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
     * Total and available  
     */
    function activeXP(uint256 id) public view returns(uint256, uint256) {
        return (totalXP[id], totalXP[id].sub(usedXP[id]));
    }

    /**
     * @dev Returns the available XP of unit  
     */
    function getAvailableXP(uint256[] ids) public view returns(uint256[] xp) {
        uint256 l = ids.length;
        require(l <= 32);
        xp = new uint256[](l);
        for(uint256 i = 0; i < l; i++){
          xp[i] = totalXP[id[i]].sub(usedXP[id[i]]);
        }
    }
    
    /**
     * @dev Gives a hero xp  
     */
    function _giveXP(uint256 id, uint256 xp) internal {
        totalXP[id] = totalXP[id].add(xp);
    }
    function giveXP(uint256[] memory ids, uint256[] memory xp) public onlyMinter {
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

    /**
     * @dev Returns the cool unit  
     */
    function getCool(uint256[] ids) public view returns(uint256[] uCool) {
        uint256 l = ids.length;
        require(l <= 32);
        uCool = new uint256[](l);
        for(uint256 i = 0; i < l; i++){
          uCool[i] = cool[ids[i]];
        }
    }

    /**
     * @dev Gives a unit cool   
     */
    function setCool(uint256[] memory ids, uint256[] memory _cool) public onlyMinter {
        require(ids.length == _cool.length);
        uint256 n = ids.length;
        for(uint256 i = 0; i < n; i++){
            cool[ids[i]] = _cool[i];
        }
    }

    /**
     * @dev Returns the unit status  
     */
    function getStatus(uint256[] ids) public view returns(uint8[][12] stat) {
        uint256 l = ids.length;
        require(l <= 32);
        stat = new uint8[][12](l);
        for(uint256 i = 0; i < l; i++){
          stat[i] = status[ids[i]];
        }
    }

    /**
     * @dev Sets a Unit status    
     */
    function setStatus(uint256[] memory ids, uint8[] memory i, uint8[] memory stat) public onlyMinter {
        require(ids.length == i.length && ids.length == stat.length);
        uint256 n = ids.length;
        for(uint256 j = 0; j < n; j++){
            status[ids[j]][i[j]] = stat[j];
        }
    }

    /**
     * @dev Returns the data of a unit   
     */
    function getUnitData(uint256[] ids) public view returns(uint256[] xp, uint256[] cCool, uint8[][12] cStatus) {
        return (getAvailableXP(ids), getCool(ids), getStatus(ids));
    }
}