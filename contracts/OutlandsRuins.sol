pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/CosmicTokenOperator.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsPlanes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroCooldown.sol";

/**
 * ropsten - 
 */

contract OutlandsRuins is MinterRole{
    //Events
    event Trade(uint256 id, address indexed player, uint256 indexed period, uint256[4] tradeData, uint256[2] reward);
    //Seed
    string seed = "OutlandsPlanes2019";
    //link to other contracts 
    CosmicTokenOperator CPX;
    OutlandsHero721 OH;
    OutlandsPlane721 OP;
    OutlandsHeroCooldown HC;
    //stress time cost 
    uint256 public coolPerStress = 60 * 12;
    //track period 
    uint256 public currentPeriod;
    uint256 public timeBetweenPeriods = 60*60*24;
    uint256 public lastReset;
    //track comleted ruins 
    mapping(bytes32 => bool) _completedRuins;

    //core data 
    address admin;
    address payable bank;
    uint256 public costToTrade = 1 finney;

    constructor() public {
        admin = msg.sender;
        bank = 0xB62cCa4D5982D52dff6043fCab8DEBe2bbaBf6AA;
        //time 
        currentPeriod = 1;
        //set up addresses
        OH = OutlandsHero721(0xeBEF6F1ffc0c97a83FB136F9D45f81a6E471B4B8);
        OP = OutlandsPlane721(0xa8Af2e26488a02A4653687f71EFA212a2001e7a2);
        HC = OutlandsHeroCooldown(0x0152Cf49360eed5B35c170081Ee8aC0e5c1e2e7C);
        //add MinterRole
        addMinter(0xB62cCa4D5982D52dff6043fCab8DEBe2bbaBf6AA);
    }
    
    /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
        //renounce  minter
        HC.renounceMinter();
        //destroy
        selfdestruct(bank);
    }
    
    /**
     * @dev Set Bank 
     */
    function setBank(address payable _bank) public {
        require(msg.sender == admin);
        bank = _bank;
    }
    
    /**
     * @dev Set Bank 
     */
    function setCost(uint256 cost) public {
        require(msg.sender == admin);
        costToTrade = cost;
    }
    
    /**
     * @dev Set Cooldown Time 
     */
    function setCooldown(uint256 time) public {
        require(msg.sender == admin);
        coolPerStress = time;
    }
    
    /**
     * @dev Set Time 
     */
    function setTimeBetweenPeriods(uint256 time) public {
        require(msg.sender == admin);
        timeBetweenPeriods = time;
    }
    
    /**
     * @dev Pushes next period 
     * Resets challenges and updates current period 
     */
    function nextPeriod() public onlyMinter {
        currentPeriod = currentPeriod+1;
        lastReset = now;
    }
    
    function _ruinHash(uint256 i) internal view returns(bytes32) {
        return keccak256(abi.encodePacked(seed,"ruin",currentPeriod,i));
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
     * @dev Internal function to determine the size beased upon 1024 probability 
     */
    function _size(uint256 ruin) internal view returns(uint256 size) {
        bytes32 hash = keccak256(abi.encodePacked("size",_ruinHash(ruin)));
        //take the first to places 
        uint256 val = (uint8(hash[0])*256 + uint8(hash[1])) % 1024;
        //determine n 
        uint8 n = 0;
        if(val <= 512) n = 1;
        else if(val <= 768) n = 2;
        else if(val <= 970) n = 3;
        else if(val <= 1022) n = 4;
        else n = 5;
        
        //loop - 1d4 per n 
        for(uint8 i = 0; i < n; i++){
            size += 1 + uint8(hash[2+i])%4;
        }
    }
    
    /**
     * @dev Internal function to determine the size beased upon 1024 probability 
     */
    function subSize(uint256 ruin) public view returns(uint256[] memory size) {
        uint256 sz = _size(ruin);
        uint256 step;
        bytes32[3] memory hash = [keccak256(abi.encodePacked("size",_ruinHash(ruin),uint8(0))),keccak256(abi.encodePacked("size",_ruinHash(ruin),uint8(1))),keccak256(abi.encodePacked("size",_ruinHash(ruin),uint8(2)))];
        //basic size distribution
        uint8[16] memory range = [2,3,4,5,3,4,5,6,4,5,6,7,5,6,7,8];
        //return sub size based upon hash 
        size = new uint256[](sz);
        for(uint256 i = 0; i < sz; i++){
            step = i/32;
            size[i] = range[uint8(hash[step][i-(step*32)]) % 16];
        }
    }
    
    
}