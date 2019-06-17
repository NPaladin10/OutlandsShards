pragma solidity ^0.5.0;

interface TokenRegistry {
    function Token(uint256 _i) external view returns(address);
}

interface PlaneGen {
    function CPX(uint256 pi, uint256 si) external view returns(uint256[3] memory colors, uint256[3] memory mag);
}

interface OutlandsPlanes {
    function planeFinder(uint256 pi, uint256 si) external view returns(address);
}

interface ERC777 {
    function mint(address operator,
        address account,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData) external;
}

contract PlaneTap {
    address owner;
    PlaneGen Gen;
    TokenRegistry TR;
    OutlandsPlanes P;
    
    uint256 public timeBetweenTaps;
    mapping (uint256 => mapping(uint256 => uint256)) public nextTap;
    
    constructor (address _p, address _gen, address _tr) public {
        owner = msg.sender;
        //set the interface contracts 
        Gen = PlaneGen(_gen);
        TR = TokenRegistry(_tr);
        P = OutlandsPlanes(_p);
    }
    
    function _token(uint256 _i) internal view returns(address) {
        return TR.Token(_i);
    }

    function _mint(address _finder, address _who, uint256 _color, uint256 _val) internal {
        uint256 maxVal = 1 ether * _val / 100;
        address t = _token(_color);
        bytes memory nb;
        //The one who taps gets 89%, the finder gets 10%
        ERC777(t).mint(t, _who, maxVal * 89/100, nb, nb);
        ERC777(t).mint(t, _finder, maxVal * 10/100, nb, nb);
        ERC777(t).mint(t, owner, maxVal * 1/100, nb, nb);
    }

    function tap(uint256 pi, uint256 si) public {
        //cannot claim too quickly 
        require(nextTap[pi][si] < now);
        //update time 
        nextTap[pi][si] = now + timeBetweenTaps;
        //finder 
        address finder = P.planeFinder(pi, si);
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
