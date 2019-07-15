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
    OutlandsPlane721 OP;
    OutlandsHeroCooldown HC;
    //Cooldown 
    uint256 public merchantCooldown = 60 * 60;
    //track period 
    uint256 public currentPeriod;
    uint256 public timeBetweenPeriods = 60*60*24;
    uint256 public lastReset;
    //track needs met and surplus remains 
    mapping(bytes32 => bool) _needMet;
    mapping(bytes32 => bool) _surplusUsed;

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
    
    /**
     * @dev Internal function to determine the rarity of a number based on 256 probability
     */
    function _rarity(uint8 _r) internal pure returns(uint8) {
        if(_r <= 128) return 1;
        else if(_r <= 206) return 2;
        else if(_r <= 251) return 3;
        else if(_r <= 254) return 4;
        else return 5;
    }
    
    /**
     * @dev Internal function to determine the number of surplus/needs that period 
     */
    function _n(bytes32 hash) internal pure returns(uint8) {
        return 1 + uint8(hash[0]) % 2;
    }
    
    /**
     * @dev Internal function to compute basic hash for a period/plane  
     */
    function _periodHash(uint256 plane, uint256 i) internal view returns(bytes32) {
        return keccak256(abi.encodePacked(currentPeriod, plane, i));
    }
    
    function _hash(uint256 plane, bool need) internal view returns(bytes32) {
        if (need) {
            return keccak256(abi.encodePacked(seed,"need",plane,currentPeriod));
        }
        else {
            return keccak256(abi.encodePacked(seed,"surplus",plane,currentPeriod));
        }
    }
    
    /**
     * @dev Determine the need of a plane 
     * Free of restriction because that is check in the meet function 
     * Needs do not have quality 
     */
    function needs(uint256 plane, uint256 i) public view returns(uint8) {
        bytes32 hash = _hash(plane,true);
        //set need 
        return uint8(hash[i+1]) % 16;
    }
    
    /**
     * @dev Determine the surplus of a plane 
     * Free of restriction because that is check in the meet function 
     * Surplus have a id and quality 
     */
    function surplus(uint256 plane, uint256 i) public view returns(uint8[2] memory s) {
        bytes32 hash = _hash(plane,false);
        //set surplus - what, rarity 
        s[0] = uint8(hash[2*i+1]) % 16;
        s[1] = _rarity(uint8(hash[2*i+2]));
    }
    
    /**
     * @dev Meet a Need based upon known surplus 
     */
    function meetANeed(uint256 fromPlane, uint8 i, uint256 toPlane, uint8 j) public {
        //planes must exist
        require(fromPlane < OP.totalSupply() && toPlane < OP.totalSupply());
        //get baskic period hash 
        bytes32 fromHash = _periodHash(fromPlane, i);
        bytes32 toHash = _periodHash(toPlane, i);
        //make sure need / surplus remains 
        require(!_needMet[toHash] && !_surplusUsed[fromHash]);
        //check the index does not exceen need / surplus number
        require(i <= _n(_hash(fromPlane, false)) && j <= _n(_hash(fromPlane, true)));
        //check need matches surplus 
        uint8 _need = needs(toPlane,j);
        uint8[2] memory _surplus = surplus(fromPlane,i);
        require(_need == _surplus[0]);
        //now set that the deal is done 
        _surplusUsed[fromHash] = true;
        _needMet[toHash] = true;
        //Give reward - partial based on quality
        uint256 multi = 10**_surplus[1];
        uint256 val = multi * 1 ether;
        CPX.simpleMint(, msg.sender, val);
    }
}
