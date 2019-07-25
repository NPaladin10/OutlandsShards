pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/OutlandsUnitStatus.sol";

/**
 * kovan - 0x402980511D1e0BAc23810B1c1B5ce99e56d867aA
 */

contract OutlandsTrouble is MinterRole{
    event ChallengeRecord (uint256 indexed period, address indexed player, uint256 planeId, uint256 points, bytes res);
    //link to other contracts 
    OutlandsUnitStatus OU;
    //stress time cost 
    uint256 public coolPerStress = 60 * 12;

    //listing of activecompleted challenges 
    mapping (bytes32 => bool) public completedChallenges;
    
    //core data 
    address payable admin;

    constructor() public {
        admin = msg.sender;
        //set up addresses
        OU = OutlandsUnitStatus(0x246e9084e0a8572FDAc05d2029CDe383c54A830c);
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
        if(OU.isMinter(address(this)))OU.renounceMinter();
        //destroy
        selfdestruct(admin);
    }

    /**
     * @dev Set Stress Cost in  Time 
     */
    function setCoolPerStress(uint256 time) public {
        require(msg.sender == admin);
        coolPerStress = time;
    }
    
    /**
     * @dev Pushes next period 
     * Resets challenges and updates current period 
     */
    function currentPeriod() public view returns (uint256){
        return now / (24*60*60);
    }
    
    /**
     * @dev Check whether a player has completed a challenge 
     */
    function mayCompleteCheck(uint256 planeId, address player) public view returns (bool mayComplete, uint256 period, uint256 cool){
        bytes32 hash = _challengeHash(currentPeriod(),planeId,player);
        mayComplete = !completedChallenges[hash];
        period = currentPeriod();
        cool = coolPerStress;
    }
    
    //creates a unique hash - to record if challenge is complete 
    function _challengeHash(uint256 period, uint256 planeId, address player) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(period, planeId, player));
    }
    
    /**
     * @dev Rewards the player 
     * Gives xp to heroes 
     * Reports that the challenge is complete 
     * res is bytes result of what happend so that it can be re-created  
     */
    function complete(address player, uint256 period, uint256 planeId, uint256 points, uint256[] memory ids, uint256[] memory xp, uint256[] memory cool, bytes memory res) public onlyMinter {
        bytes32 cHash = _challengeHash(period, planeId, player);
        require(!completedChallenges[cHash]);
        ///report the challenge is complete 
        completedChallenges[cHash] = true;
        //give xp
        OU.giveXP(ids,xp);
        //set cool 
        OU.setCool(ids,cool);
        //record the challenge 
        emit ChallengeRecord(period, player, planeId, points, res);
    }
}