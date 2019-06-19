pragma solidity ^0.5.0;

interface IPlane {
    function planeToToken(uint256 pi, uint256 si) external view returns(address, uint256);
}

interface Registry {
    function simpleMintToken(uint256 _i, address _who, uint256 _amt) external;
    function isMinter(address minter) external returns(bool);
    function renounceMinter() external;
}

interface PlaneGen {
    function CPX(uint256 pi, uint256 si) external view returns(uint256[3] memory colors, uint256[3] memory mag);
}

/**
 * @dev Tap Planes for CPX  
 * 
 * Ropsten - 
 */

contract PlaneTap {
    address payable owner;
    IPlane Planes;
    PlaneGen Gen;
    Registry TR;

    uint256 public timeBetweenTaps;
    mapping (uint256 => mapping(uint256 => uint256)) public nextTap;
    
    constructor () public {
        owner = msg.sender;
        //set the interface contracts 
        Gen = PlaneGen(0xBC4e464f489c74978b8DeF438D37a62236A26add);
        TR = Registry(0x5BB1a3E7ED4566aE9Ac02372bdD777245A6CcBa5);
        Planes = IPlane(0x53CC757F23d3DC78fAA5b4D0B807e8cD3d548057);
    }
    
    function kill () public {
        require(msg.sender == owner);
        //renounce minter 
        if(TR.isMinter(address(this))) TR.renounceMinter();
        //destroy
        selfdestruct(owner);
    }
    
    function setTimeBetweenTaps(uint256 _time) public {
        require(msg.sender == owner);
        timeBetweenTaps = _time;
    }

    function _mint(address _finder, address _who, uint256 _color, uint256 _val) internal {
        //values go from 10 to 20 
        uint256 maxVal = (_val * 1 ether) / 10;
        //The one who taps gets 89%, the finder gets 10%
        TR.simpleMintToken(_color, _who, (89 * maxVal) /100);
        TR.simpleMintToken(_color, _finder, maxVal /10);
        TR.simpleMintToken(_color, owner, maxVal /100);
    }

    function tap(uint256 pi, uint256 si) public {
        //finder 
        uint256 tid;
        address finder;
        (finder, tid) = Planes.planeToToken(pi, si);
        //must be found 
        require(finder != address(0));
        //cannot claim too quickly 
        require(nextTap[pi][si] < now);
        //update time 
        nextTap[pi][si] = now + timeBetweenTaps;
        //get cosmic 
        uint256[3] memory colors;
        uint256[3] memory vals;
        (colors, vals) = Gen.CPX(pi, si);
        //loop
        for(uint256 i = 0; i < 3; i++) {
            if(vals[i] > 0) {
                //has to have val to mint 
                _mint(finder, msg.sender, colors[i], vals[i]);
            }
        }
    }
}