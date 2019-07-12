pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/CosmicTokenOperator.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsPlanes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroCooldown.sol";

/**
 * ropsten - 
 */

contract OutlandsMerchant is MinterRole{
    string seed = "OutlandsPlanes2019";
    //link to other contracts 
    CosmicTokenOperator CPX;
    OutlandsHero721 OH;
    OutlandsHeroCooldown HC;
    //track period 
    uint256 public currentPeriod;
    uint256 public timeBetweenPeriods = 60*60*24;
    uint256 public lastReset;

    //core data 
    address admin;
    address payable bank;
    uint256 public costToChallenge = 1 finney;
    
    constructor() public {
        admin = msg.sender;
        bank = 0xB62cCa4D5982D52dff6043fCab8DEBe2bbaBf6AA;
        //time 
        currentPeriod = 1;
        //set up addresses
        OH = OutlandsHero721(0x0DCd2F752394c41875e259e00bb44fd505297caF);
        CPX = CosmicTokenOperator(0x61a89f29cDeEBd7fdBC8c2d84Cd21f2c8aAd88e4);
        //add MinterRole
        addMinter(0xB62cCa4D5982D52dff6043fCab8DEBe2bbaBf6AA);
    }
    
    function _hash(uint256 plane, bool need) internal view returns(bytes32) {
        if (need) {
            return keccak256(abi.encodePacked(seed,"need",plane,currentPeriod));
        }
        else {
            return keccak256(abi.encodePacked(seed,"surplus",plane,currentPeriod));
        }
    }
    
    function needs(uint256 plane, uint256 i) public view returns(uint8) {
        bytes32 hash = _hash(plane,true);
        return uint8(hash[i]) % 16;
    }
    
    function surplus(uint256 plane, uint256 i) public view returns(uint8) {
        bytes32 hash = _hash(plane,false);
        return uint8(hash[i]) % 16;
    }
}
