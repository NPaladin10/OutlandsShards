pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/CosmicTokenOperator.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsXP.sol";

/**
 * ropsten - 0xF4bE45F3d3d3042dd0ebB495eE9173632d3f183a
 */

contract OutlandsTrouble is MinterRole{
    event NewChallenge (uint256 indexed period, address indexed player, uint256 indexed plane);
    event CompleteChallenge (uint256 indexed period, address indexed player, bytes32 hash);
    //link to other contracts 
    //Hero NFT
    CosmicTokenOperator CPX;
    OutlandsHero721 OH;
    OutlandsXP XP;
    //map when heroes were last committed
    mapping (uint256 => uint256) internal _lastPeriod;
    //track period 
    uint256 public currentPeriod;

    //structure of challenge
    struct Challenge {
        address player;
        uint256 tid;
        uint256[] heroes;
    }
    //listing of active challenges 
    Challenge[] activeChallenges;
    
    //core data 
    address admin;
    address payable bank;
    uint256 costToChallenge = 1 finney;
    
    constructor() public {
        admin = msg.sender;
        bank = msg.sender;
        //set up addresses
        XP = OutlandsXP(0x58E2671A70F57C1A76362c5269E3b1fD426f43a9);
        OH = OutlandsHero721(0xeBEF6F1ffc0c97a83FB136F9D45f81a6E471B4B8);
        CPX = CosmicTokenOperator(0x61a89f29cDeEBd7fdBC8c2d84Cd21f2c8aAd88e4);
    }

    /**
     * @dev Validates that the heroes can be used in a challenge 
     * Heroes can only be used in one challenge per period
     * Heroes must be owned by the player 
     */
    function _canChallenge (address player, uint256[] memory heroes) internal {
        for(uint256 i = 0; i < 6; i++){
            require(player == OH.ownerOf(heroes[i]));
            require(_lastPeriod[heroes[i]] < currentPeriod);
            //update last active period
            _lastPeriod[heroes[i]] = currentPeriod;
        }
    }
    
    /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
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
     * @dev Pushes next period 
     * Resets challenges and updates current period 
     */
    function nextPeriod() public onlyMinter {
        delete activeChallenges;
        currentPeriod++;
    }
    
    /**
     * @dev Rewards the player 
     * Gives xp to heroes 
     * Gives cpx to player 
     * Reports that the challenge is complete 
     */
    function reward(uint256[] memory ids, uint256[2][] memory cpx, uint256[6][] memory xp, bytes32[] memory hash) public onlyMinter {
        require(ids.length == cpx.length && ids.length == xp.length && ids.length == hash.length);
        uint256 n = ids.length;
        Challenge memory C;
        for(uint256 i = 0 ; i < n; i++){
            C = activeChallenges[ids[i]];
            //give xp
            for(uint256 j = 0 ; j < n; j++){
                XP.giveXPSingle(C.heroes[j], xp[i][j]);
            }
            //give cpx
            CPX.simpleMint(cpx[i][0], C.player, cpx[i][1]);
            //report the challenge is complete 
            emit CompleteChallenge(currentPeriod, C.player, hash[i]);
        }
    }

    /**
     * @dev Adds extra cooldown phases to a hero 
     */
    function addCooldown(uint256[] memory hi, uint256[] memory cool) public onlyMinter {
        require(hi.length == cool.length);
        uint256 n = hi.length;
        for(uint256 i = 0; i < n; i++){
            _lastPeriod[hi[i]] += cool[i];
        }
    }

    /**
     * @dev public call to submit heroes to Challenge
     * Heroes can only be used in one challenge per period
     */
    function submitChallenge(uint256 ti, uint256[] memory heroes) public payable {
        require(msg.value >= costToChallenge);
        require(heroes.length == 6);
        //pay bank
        bank.transfer(address(this).balance);
        //validates heroes 
        _canChallenge(msg.sender, heroes);
        //creates a new challenge 
        Challenge memory tC = Challenge(msg.sender, ti, heroes);
        activeChallenges.push(tC);
        //Challenge made
        emit NewChallenge(currentPeriod, msg.sender, ti);
    }
}