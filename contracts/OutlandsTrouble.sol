pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/CosmicTokenOperator.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroCooldown.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsXP.sol";

/**
 * ropsten - 0x478788C4fCA61190D3fE3147A1844577571220B3
 */

contract OutlandsTrouble is MinterRole{
    event NewChallenge (bytes32 id, uint256 period, address indexed player, uint256 indexed plane, uint256[] heroes);
    event CompleteChallenge (bytes32 id, bytes32 hash, uint256[] pxp);
    //link to other contracts 
    //Hero NFT
    CosmicTokenOperator CPX;
    OutlandsHero721 OH;
    OutlandsXP XP;
    OutlandsHeroCooldown HC;
    //stress time cost 
    uint256 public coolPerStress = 60 * 12;
    //track period 
    uint256 public currentPeriod;
    uint256 public timeBetweenPeriods = 60*60*24;
    uint256 public lastReset;

    //listing of activecompleted challenges 
    mapping (bytes32 => bool) public completedChallenges;
    
    //core data 
    address admin;
    address payable bank;
    uint256 public costToChallenge = 4 finney;
    
    constructor() public {
        admin = msg.sender;
        bank = 0xB62cCa4D5982D52dff6043fCab8DEBe2bbaBf6AA;
        //time 
        currentPeriod = 1;
        lastReset = now;
        //set up addresses
        XP = OutlandsXP(0x58E2671A70F57C1A76362c5269E3b1fD426f43a9);
        OH = OutlandsHero721(0xeBEF6F1ffc0c97a83FB136F9D45f81a6E471B4B8);
        CPX = CosmicTokenOperator(0x61a89f29cDeEBd7fdBC8c2d84Cd21f2c8aAd88e4);
        HC = OutlandsHeroCooldown(0x0152Cf49360eed5B35c170081Ee8aC0e5c1e2e7C);
        //add MinterRole
        addMinter(0xB62cCa4D5982D52dff6043fCab8DEBe2bbaBf6AA);
    }

    /**
     * @dev Validates that the heroes can be used in a challenge 
     * Heroes can only be used in one challenge per period
     * Heroes must be owned by the player 
     */
    function _canChallenge (address player, uint256[] memory heroes) internal view returns(bool){
        uint256 hi;
        uint256 n = heroes.length;
        for(uint256 i = 0; i < n; i++){
            hi = heroes[i];
            require(player == OH.ownerOf(hi));
            require(HC.cooldown(hi) <= now);
        }
        return true;
    }
    
    /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
        //renounce  minter
        CPX.renounceMinter();
        XP.renounceMinter();
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
        costToChallenge = cost;
    }
    
    /**
     * @dev Set Stress Cost in  Time 
     */
    function setStressTimeCost(uint256 time) public {
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
    
    /**
     * @dev Rewards the player 
     * Gives xp to heroes 
     * Gives cpx to player 
     * Reports that the challenge is complete 
     */
    function complete(bytes32 id, bytes32 hash, address player, uint256[2] memory cpx, uint256[] memory heroes, uint256[] memory xp, uint256[] memory pxp, uint256[] memory cool) public onlyMinter {
        require(!completedChallenges[id]);
        require(heroes.length == xp.length && heroes.length == pxp.length && heroes.length == cool.length);
        uint256 n = heroes.length;
        //give xp
        for(uint256 j = 0 ; j < n; j++){
            if(xp[j] > 0) {
                //give xp 
                XP.giveXPSingle(heroes[j], xp[j]);
            }
            if(cool[j] > 0) {
                //set cool 
                HC.setSingle(heroes[j], cool[j]);
            }
        }
        //give cpx
        if(cpx[1] > 0) {
            CPX.simpleMint(cpx[0], player, cpx[1]);
        }
        //report the challenge is complete 
        completedChallenges[id] = true;
        emit CompleteChallenge(id, hash, pxp);
    }

    /**
     * @dev public call to submit heroes to Challenge
     * Heroes can only be used in one challenge per period
     */
    function submitChallenge(uint256 plane, uint256[] memory heroes) public payable {
        uint256 n = 6;
        require(msg.value >= costToChallenge);
        require(heroes.length == n);
        //pay bank
        bank.transfer(address(this).balance);
        //validates heroes 
        _canChallenge(msg.sender, heroes);
        //creates a new challenge 
        bytes32 cid = keccak256(abi.encodePacked(currentPeriod,msg.sender,plane,heroes,now));
        //Challenge made
        emit NewChallenge(cid, currentPeriod, msg.sender, plane, heroes);
    }
}