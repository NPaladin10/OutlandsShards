pragma solidity ^0.5.0;

import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

// ropsten - 0x0152Cf49360eed5B35c170081Ee8aC0e5c1e2e7C

contract OutlandsHeroCooldown is MinterRole{
    //tracks cooldown of a particular hero 
    mapping (uint256 => uint256) public cooldown;
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
     * @dev Sets the cooldown of a hero 
     */
    function setSingle(uint256 id, uint256 cool) public onlyMinter  {
        cooldown[id] = cool;
    }
    function setArray(uint256[] memory ids, uint256[] memory cool) public onlyMinter {
        require(ids.length == cool.length);
        uint256 n = ids.length;
        for(uint256 i = 0; i < n; i++){
            cooldown[ids[i]] = cool[i];
        }
    }
}