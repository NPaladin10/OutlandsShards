pragma solidity ^0.5.0;

import  "./CPX777-test.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
* Ropsten - 0x61a89f29cDeEBd7fdBC8c2d84Cd21f2c8aAd88e4
*/

contract CosmicTokenOperator is MinterRole {
    address builder;
    CPX777[] Tokens;
    
    uint256 _current;
    
    constructor() public {
        builder = msg.sender;
    }
    
    function addToken(string memory name, string memory symbol) public returns(address) {
        require(msg.sender == builder);
        uint256 count = Tokens.length;
        address[] memory operators = new address[](1);
        operators[0] = address(this);
        Tokens.push(new CPX777(name, symbol,operators));
        return address(Tokens[count]);
    }
    
    function getTokenAdresses() public view returns(address[] memory list) {
        uint256 n = Tokens.length;
        list = new address[](n);
        for(uint256 i = 0; i < n; i++){
            list[i] = address(Tokens[i]);
        }
    }
    
    /**
     * @dev Get all the CPX of an address 
     * 
     */
    function getCPX(address account) public view returns(uint256[7] memory cpx) {
        //loop to get balance 
        for(uint8 i = 0; i < 7; i++) {
            cpx[i] = Tokens[i].balanceOf(account);
        }
    }
    
    /**
     * @dev Mint of a Token   
     * First is internal, second is simple mint with no data, third is full mint with data 
     * 
     */
    function _mintTokens(uint256 _i, address _who, uint256 _amt, bytes memory _data, bytes memory _opData) internal {
        Tokens[_i].mint(address(this), _who, _amt, _data, _opData);
    }
    function simpleMint(uint256 _i, address _who, uint256 _amt) public onlyMinter {
        bytes memory noData;
        _mintTokens(_i, _who, _amt, noData, noData);
    }
    function mint(uint256 _i, address _who, uint256 _amt, bytes memory _data, bytes memory _opData) public onlyMinter {
        _mintTokens(_i, _who, _amt, _data, _opData);
    }
    
    /**
     * @dev Use contract to send tokens 
     * 
     */
    function _sendTokens(uint256 _i, address _who, address recipient, uint256 _amt, bytes memory _data, bytes memory _opData) internal {
        //check for value 
        require(Tokens[_i].balanceOf(_who) >= _amt, "Not enough Balance");
        Tokens[_i].operatorSend(_who, recipient, _amt, _data, _opData);
    }
    function send(uint256 _i, address _who, address recipient, uint256 _amt, bytes memory _data, bytes memory _opData) public onlyMinter {
        _sendTokens(_i, _who, recipient, _amt, _data, _opData);
    }
    function simpleSend(uint256 _i, address _who, address recipient, uint256 _amt) public onlyMinter {
        bytes memory noData;
        _sendTokens(_i, _who, recipient, _amt, noData, noData);
    }
    
    /**
     * @dev Full Burn of a token with data 
     * 
     */
    function _burnToken(uint256 _i, address _who, uint256 _amt, bytes memory _data, bytes memory _opData) internal {
        //check for value 
        require(Tokens[_i].balanceOf(_who) >= _amt, "Not enough Balance");
        Tokens[_i].operatorBurn(_who, _amt, _data, _opData);
    }
    function burn(uint256 _i, address _who, uint256 _amt, bytes memory _data, bytes memory _opData) public onlyMinter {
        _burnToken(_i, _who, _amt, _data, _opData);
    }
    function simpleBurn(uint256 _i, address _who, uint256 _amt) public onlyMinter {
        bytes memory noData;
        _burnToken(_i, _who, _amt, noData, noData);
    }
    
    /**
     * @dev Combine CPX colors to make Diamond
     * 
     */
    function _burnColors(address who, uint256 _amt) internal {
        //now burn the colors 
        bytes memory noData;
        for(uint256 i = 1; i < 7; i++) {
            _burnToken(i, who, _amt, noData, noData);
        }
    }
    function burnColors(address who, uint256 _amt) public onlyMinter {
        _burnColors(who, _amt);
    }
    function makeDiamond(uint256 _amt) public {
        //do the burn
        _burnColors(msg.sender, _amt);
        bytes memory noData;
        //now keep amount
        //owner gets 1%
        _mintTokens(0, builder, _amt / 100, noData, noData);
        //amount is variable
        bytes32 hash = keccak256(abi.encodePacked(Tokens[0].totalSupply(), now, msg.sender));
        uint8 vp = uint8(hash[0]) % 16;
        uint256 pamt = (75+vp) * _amt /100;
        //mint
        _mintTokens(0, msg.sender, pamt, noData, noData);
    }
    
}
