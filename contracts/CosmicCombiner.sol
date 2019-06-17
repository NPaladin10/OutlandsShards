pragma solidity ^0.5.0;

import "./ERC20.sol";
import "./TokenRegistry.sol";


/**
 * @dev Outlands: Allows players to combine Cosmic to get Diamond
 * TR 0x69a87845f643c4885a6407452782c504b7961bf6
 * 
 * Ropsten - 0x0bd779a90304171beaa5c3538c65fc2f8c136d12
 *
 */

contract CosmicCombiner {
    event Combined (address indexed who, uint256 amount);
    
    address payable owner;
    TokenRegistry TR;
    mapping (address => uint256) internal _readyToMint;
    
    /** @dev Constructor - loads TokenRegistry 
     * 
     * _tokens - address link to TokenRegistry
     */
    constructor(address _tokens) public {
        owner = msg.sender;
        TR = TokenRegistry(_tokens);
    }
    
    /** INTERNAL   
    */
    /** @dev Easy internal link to token addresses stored in TokenRegistry 
    */
    function _token(uint256 _i) internal view returns(address) {
        return TR.Tokens(_i);
    }
    /** @dev Internal link to CPXD Token address 
    */
    function _cpxd() internal view returns(address) {
        return TR.Tokens(0);
    }
    
    /** @dev Kill function 
     * Removes minter from Tokens 
    */
    function kill () public {
        require(msg.sender == owner);
        //renounce minter - only first contract 
        ERC20(_cpxd()).renounceMinter();
        //destroy
        selfdestruct(owner);
    
        
    }
    /** @dev Sets TokenRegistry 
    */
    function setRegistry (address _tr) public {
        require(msg.sender == owner);
        TR = TokenRegistry(_tr);
    }
    
    /** @dev Provides the amount that a player may mint  
    */
    function toMint() public view returns(uint256 mint) {
        mint = _readyToMint[msg.sender];
    }
    
    /** @dev Allows player to mint CPXD
     * Player must first use combine to sacrifice the same amount of each color of CPX  
     * They do not recieve 100% equivalent in diamond there is always friction loss 
    */
    function mintCPXD() public {
        //now mint the CPX
        uint256 _amount = _readyToMint[msg.sender];
        _readyToMint[msg.sender] = 0;
        //owner gets 1%
        ERC20(_cpxd()).mint(owner, _amount / 100);
        //amount is variable
        bytes32 hash = keccak256(abi.encodePacked(now, msg.sender));
        uint8 vp = uint8(hash[0]) % 16;
        uint256 amt = _amount * (75+vp)/100;
        //mint
        ERC20(_cpxd()).mint(msg.sender, amt);
    }
    
    /** @dev Sacrifices CPX to later mint CPXD
     * Player must first use combine to sacrifice the same amount of each color of CPX  
    */
    function combine(uint256 _amount) public {
        uint256 _tmax = TR.getMax();
        //require proper allowance of CPX 
        for(uint256 i = 1; i < _tmax; i++) {
            uint256 _allowance = ERC20(_token(i)).allowance(msg.sender, address(this));
            uint256 _balance = ERC20(_token(i)).balanceOf(msg.sender);
            //require 
            require(_allowance > _amount, "Combiner: not enough allowance.");
            require(_balance > _amount, "Combiner: not enough tokens.");
        }
        
        //now burn the colors 
        for(uint256 i = 1; i < _tmax; i++) {
            ERC20(_token(i)).burnFrom(msg.sender, _amount);
        }
        
        _readyToMint[msg.sender] += _amount;
        emit Combined(msg.sender, _amount);
    }
}
