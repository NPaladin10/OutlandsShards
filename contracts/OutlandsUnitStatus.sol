pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
* @dev 
*   Kovan - 0x246e9084e0a8572FDAc05d2029CDe383c54A830c
*/

contract OutlandsUnitStatus is MinterRole{
    using SafeMath for uint256;
    //tracks XP given and expended 
    mapping (uint256 => uint256) public totalXP;
    mapping (uint256 => uint256) internal usedXP;
    //tracks Cooldown 
    mapping (uint256 => uint256) public cool;
    //tracks status - max of 12 status
    mapping (uint256 => uint16[12]) public status;
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
    function getXP(uint256[] memory ids) public view returns(uint256[] memory total, uint256[] memory available) {
        uint256 n = ids.length;
        require(n <= 32);
        //set dynamic sizes 
        total = new uint256[](n);
        available = new uint256[](n);
        //loop 
        uint256 _id;
        for(uint256 i = 0; i < n; i++){
            _id = ids[i];
            total[i] = totalXP[_id];
            available[i] = totalXP[_id].sub(usedXP[_id]);
        }
    }

    /**
     * @dev Returns the available XP of unit  
     */
    function getAvailableXP(uint256[] memory ids) public view returns(uint256[] memory xp) {
        uint256 n = ids.length;
        require(n <= 32);
        //set dynamic sizes 
        xp = new uint256[](n);
        for(uint256 i = 0; i < n; i++){
          xp[i] = totalXP[ids[i]].sub(usedXP[ids[i]]);
        }
    }
    
    /**
     * @dev Gives a hero xp  
     */
    function giveXP(uint256[] memory ids, uint256[] memory xp) public onlyMinter {
        uint256 n = ids.length;
        require(n == xp.length);
        uint256 _id;
        for(uint256 i = 0; i < n; i++){
            _id = ids[i];
            totalXP[_id] = totalXP[_id].add(xp[i]);
        }
    }
    
    /**
     * @dev Uses a heroe's xp
     */
    function useXP(uint256[] memory ids, uint256[] memory xp) public onlyMinter {
        uint256 n = ids.length;
        require(ids.length == xp.length);
        uint256 _id;
        for(uint256 i = 0; i < n; i++){
            _id = ids[i];
            usedXP[_id] = usedXP[_id].add(xp[i]);
        }
    }

    /**
     * @dev Returns the cool unit  
     */
    function getCool(uint256[] memory ids) public view returns(uint256[] memory cCool) {
        uint256 n = ids.length;
        require(n <= 32);
        //set dynamic sizes 
        cCool = new uint256[](n);
        for(uint256 i = 0; i < n; i++){
          cCool[i] = cool[ids[i]];
        }
    }

    /**
     * @dev Gives a unit cool   
     */
    function setCool(uint256[] memory ids, uint256[] memory _cool) public onlyMinter {
        uint256 n = ids.length;
        require(n == _cool.length);
        for(uint256 i = 0; i < n; i++){
            cool[ids[i]] = _cool[i];
        }
    }

    /**
     * @dev Returns the unit status  
     */
    function getStatus(uint256[] memory ids) public view returns(uint16[12][] memory cStatus) {
        uint256 n = ids.length;
        require(n <= 32);
        //set dynamic sizes 
        cStatus = new uint16[12][](n);
        for(uint256 i = 0; i < n; i++){
          cStatus[i] = status[ids[i]];
        }
    }

    /**
     * @dev Sets a Unit status    
     */
    function setStatus(uint256[] memory ids, uint8[] memory i, uint16[] memory _status) public onlyMinter {
        uint256 n = ids.length;
        require(n == i.length && n == _status.length);
        for(uint256 j = 0; j < n; j++){
            status[ids[j]][i[j]] = _status[j];
        }
    }

    /**
     * @dev Returns the data of a unit   
     */
    function getUnitData(uint256[] memory ids) public view returns(uint256[] memory xp, uint256[] memory cCool, uint16[12][] memory cStatus) {
        return (getAvailableXP(ids), getCool(ids), getStatus(ids));
    }
}