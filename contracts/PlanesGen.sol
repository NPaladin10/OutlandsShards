pragma solidity ^0.5.0;

/**
 * Ropsten - 0x3dd41e473656F8fe1907987334E89a3Bb422C2Eb 
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
    
    function _nc(bytes32 hash, uint256 si) internal view returns(uint256 n) {
        n = nCPX[uint8(hash[1])%8];
        //check for first 
        if(si == 0 && n < 3) {
            n += 1; 
        }
    }
    
    //max number of shards from a planet  
    function maxShards(uint256 pi) public view returns(uint256) {
        bytes32 hash = _planetHash(pi);
        return 1 + uint8(hash[0]) % 32;
    }
    
    function maxShardArray(uint256[] memory pis) public view returns(uint256[] memory max) {
        //keep it under control 
        require(pis.length <= 32);
        //get length to define array 
        uint256 n = pis.length;
        max = new uint256[](n);
        //now loop 
        for(uint256 i = 0; i < n; i++) {
            max[i] = maxShards(pis[i]);
        }
    }
    
    function planeHash(uint256 pi, uint256 si) public view returns(bytes32) {
        if(pi == 0 || si > maxShards(pi)) return bytes32(0);
        return keccak256(abi.encodePacked(_planetHash(pi), si));
    }
    
    function CPX(uint256 pi, uint256 si) public view returns(uint256[3] memory colors, uint256[3] memory mag) {
        if(pi == 0 || si > maxShards(pi)) return (colors, mag);
        bytes32 hash = planeHash(pi, si);
        uint256 nc = _nc(hash, si);
        //loop for color and mag 
        for(uint256 i = 0; i < nc; i++) {
            colors[i] = 1 + uint8(hash[i+2]) % 6;
            mag[i] = cpxMag[uint8(hash[i+5]) % 16];
        }
    }
    
    function cpxColors(uint256 pi, uint256 si) public view returns(uint256 a, uint256 b, uint256 c) {
        if(pi == 0 || si > maxShards(pi)) return (0,0,0);
        bytes32 hash = planeHash(pi, si);
        uint256 nc = _nc(hash, si);
        //loop for color and mag 
        if(nc >= 1) a = 1 + uint8(hash[2]) % 6;
        if(nc >= 2) b = 1 + uint8(hash[3]) % 6;
        if(nc == 3) c = 1 + uint8(hash[4]) % 6;
    }
    
    function cpxVals(uint256 pi, uint256 si) public view returns(uint256 a, uint256 b, uint256 c) {
        if(pi == 0 || si > maxShards(pi)) return (0,0,0);
        bytes32 hash = planeHash(pi, si);
        uint256 nc = _nc(hash, si);
        //loop for color and mag 
        if(nc >= 1) a = cpxMag[uint8(hash[5]) % 16];
        if(nc >= 2) b = cpxMag[uint8(hash[6]) % 16];
        if(nc == 3) c = cpxMag[uint8(hash[7]) % 16];
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