pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/CosmicTokenOperator.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsHeroes721.sol";
import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsXP.sol";

/**
 * ropsten - 0x38E24687e779c49FCd0d8e00bEcbea95Dd126C61
 */

contract OutlandsTrouble is MinterRole{
    event NewChallenge (uint256 indexed period, address indexed player, uint256 indexed plane);
    event CompleteChallenge (uint256 indexed period, uint256 cid, bytes32 hash);
    //link to other contracts 
    //Hero NFT
    CosmicTokenOperator CPX;
    OutlandsHero721 OH;
    OutlandsXP XP;
    //map when heroes were last committed
    mapping (uint256 => uint256) public cooldown;
    //track period 
    uint256 public currentPeriod;
    uint256 public timeBetweenPeriods = 60*60*24;
    uint256 public lastReset;

    //structure of challenge
    struct Challenge {
        address player;
        uint256 tid;
        uint256[] heroes;
    }
    //listing of active challenges 
    Challenge[] internal _activeChallenges;
    
    //core data 
    address admin;
    address payable bank;
    uint256 public costToChallenge = 1 finney;
    
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
            require(cooldown[hi] <= currentPeriod);
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
     * @dev Set Time 
     */
    function setTimeBetweenPeriods(uint256 time) public {
        require(msg.sender == admin);
        timeBetweenPeriods = time;
    }
    
    /**
     * @dev View the number of Challenges 
     */
    function countOfChallenges() public view returns (uint256){
        return _activeChallenges.length;
    }
    
    /**
     * @dev View a particular challenge
     */
    function getChallengeById(uint256 id) public view returns (address, uint256, uint256[] memory){
        require(id < _activeChallenges.length);
        Challenge memory aC = _activeChallenges[id];
        return (aC.player, aC.tid, aC.heroes);
    }

    /**
     * @dev Pushes next period 
     * Resets challenges and updates current period 
     */
    function nextPeriod() public onlyMinter {
        delete _activeChallenges;
        currentPeriod = currentPeriod+1;
        lastReset = now;
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
            C = _activeChallenges[ids[i]];
            //give xp
            for(uint256 j = 0 ; j < n; j++){
                if(xp[i][j] > 0) {
                    XP.giveXPSingle(C.heroes[j], xp[i][j]);
                }
            }
            //give cpx
            CPX.simpleMint(cpx[i][0], C.player, cpx[i][1]);
            //report the challenge is complete 
            emit CompleteChallenge(currentPeriod, ids[i], hash[i]);
        }
    }

    /**
     * @dev Adds extra cooldown phases to a hero 
     */
    function setCooldown(uint256[] memory hi, uint256[] memory cool) public onlyMinter {
        require(hi.length == cool.length);
        uint256 n = hi.length;
        for(uint256 i = 0; i < n; i++){
            cooldown[hi[i]] = cool[i];
        }
    }

    /**
     * @dev public call to submit heroes to Challenge
     * Heroes can only be used in one challenge per period
     */
    function submitChallenge(uint256 ti, uint256[] memory heroes) public payable {
        uint256 n = 6;
        require(msg.value >= costToChallenge);
        require(heroes.length == n);
        //pay bank
        bank.transfer(address(this).balance);
        //validates heroes 
        _canChallenge(msg.sender, heroes);
        //update cooldown
        for(uint256 i = 0; i < n; i++){
            cooldown[heroes[i]] = currentPeriod + 1;
        }
        //creates a new challenge 
        Challenge memory tC = Challenge(msg.sender, ti, heroes);
        _activeChallenges.push(tC);
        //Challenge made
        emit NewChallenge(currentPeriod, msg.sender, ti);
    }
}
