pragma solidity ^0.5.0;

/**
 * Ropsten - 0xbc4e464f489c74978b8def438d37a62236a26add
 */

contract PlaneGen {
    address payable owner;
    string seed = "OutlandsPlanes2019";
    uint256[8] nCPX = [1,1,1,1,2,2,2,3];
    uint256[16] cpxMag = [10,10,11,11,12,12,13,14,14,15,16,16,17,18,19,20];
    
    constructor () public {
        owner = msg.sender;
    }
    
    function kill() public {
        require(owner == msg.sender);
        selfdestruct(owner);
    }
    
    function _planetHash(uint256 pi) internal view returns(bytes32) {
        return keccak256(abi.encodePacked(seed, pi));
    }
    
    function maxShards(uint256 pi) public view returns(uint256) {
        bytes32 hash = _planetHash(pi);
        return 1 + uint8(hash[0]) % 32;
    }
    
    function planeHash(uint256 pi, uint256 si) public view returns(bytes32) {
        if(si > maxShards(pi)) return bytes32(0);
        return keccak256(abi.encodePacked(_planetHash(pi), si));
    }
    
    function CPX(uint256 pi, uint256 si) public view returns(uint256[3] memory colors, uint256[3] memory mag) {
        if(si > maxShards(pi)) return (colors, mag);
        bytes32 hash = planeHash(pi, si);
        uint256 nc = nCPX[uint8(hash[1])%8];
        //check for first 
        if(si == 0 && nc < 3) {
            nc += 1; 
        }
        //loop for color and mag 
        for(uint256 i = 0; i < nc; i++) {
            colors[i] = 1 + uint8(hash[i+2]) % 6;
            mag[i] = cpxMag[uint8(hash[i+5]) % 16];
        }
    }

    function planetData(uint256 pi) 
        public view returns(bytes32 hash, uint256 maxS) {
            //planet hash 
            hash = _planetHash(pi);
            //handle max shards  
            maxS = maxShards(pi);
        }
    
    function planeData(uint256 pi, uint256 si) 
        public view returns(bytes32 hash, uint256[3] memory colors, uint256[3] memory mag) {
            //planet hash 
            hash = planeHash(pi, si);
            //handle cpx 
            (colors, mag) = CPX(pi, si);
        }
}
