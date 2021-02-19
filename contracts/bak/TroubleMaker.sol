// CreatureCreator.sol
// V0.1
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./CharacterLocation.sol";

/*
    Deployed 
*/
contract TroubleMaker is PausableCPX {
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    //contract references 
    CharacterLocation internal CL;
    RarityCalculator internal RC;
    
    //trouble periods 
    uint256[3] public periodTimes = [4 * 1 hours, 12 * 1 hours, 36 * 1 hours];
    //trouble count 
    uint256[3] public troubleCount = [8,6,4];
    
    //mapping of solved trouble 
    mapping (bytes32 => bool) internal _solved; 
    
    //which characters are engaged 
    mapping (uint256 => bool) internal _isInConflict;
    
    //map active confrontations and progress
    struct Conflict {
        bytes32 hash;
        uint256 charId;
        uint256 progress;
    }
    mapping (bytes32 => Conflict) internal _conflicts;
    
    constructor (CharacterLocation cl, RarityCalculator rc)
        public
    {
        CL = cl; 
        RC = rc; 
    }
    
    /*
        internal
    */
    
    //calculate the trouble hash 
    function _troubleHash (uint256 i, uint256 pOfI, uint256 j)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(i, periodTimes[i], pOfI, j));
    }
    
    /*
        view 
    */

    function getPeriods () 
        public
        view
        returns (uint256[3] memory)
    {
        uint256 _now = block.timestamp;
        return [periodTimes[0]/_now, periodTimes[1]/_now, periodTimes[2]/_now];
    }
    
    function isSolved (uint256 i, uint256 pOfI, uint256 j) 
        public
        view
        returns (bool)
    {
        return _solved[_troubleHash(i, pOfI, j)];
    }
    
    /*
        external
    */
    
    function _conflictHash (bytes32 hash, address player)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(hash, player));
    }
    
    function _troubleData (bytes32 hash) 
        internal
        view
        returns (uint256 rare, uint256 skill, uint256 steps)
    {
        rare =  RC.rarity(hash, 1);
        skill = uint8(hash[0]) % 6;
        steps = [3,3,4,4,4,5,5,6][uint8(hash[1]) % 8];
    }
    
    function opposeTrouble (bytes32 hash) 
        public
    {
        (uint256 rare, uint256 skill, uint256 steps) = _troubleData(hash);
        Conflict memory C = _conflicts[_conflictHash(hash, msg.sender)];
    }
    
    function confrontTrouble (uint256 charId, uint256 i, uint256 j)
        public
    {
        require(!_isInConflict[charId], "Already in a conflict.");
        require(CL.getCooldown(charId) < block.timestamp, "Requires cooldown.");
        
        //get data 
        (bytes32 seed, uint256 r, uint8 a, uint256 rare, uint256 id) = CL.getShardData(charId);
        uint256[3] memory pOfI = getPeriods();
        
        //match seeds 
        bytes32 _th = _troubleHash(i, pOfI[i], j);
        require(seed == _th, "Not on the right shard.");
        //require not solved
        require(!_solved[_th], "Trouble is solved.");
        
        //commit 
        _isInConflict[charId] = true;
        bytes32 cHash = _conflictHash(_th, msg.sender);
        _conflicts[cHash] = Conflict(_th, charId, 0);
    }
}