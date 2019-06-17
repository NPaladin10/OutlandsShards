pragma solidity ^0.5.0;

/** Ropsten ERC777 Tokens 
 * Diamond - 0xc7a70cb917673db93053f08504e0a7ff74cdd387
 * Ruby - 0x03bcdd8051bd8ac2182892302cf9307d9bf7ad06
 * Citrine - 0x67b3d1bc921864da467d465de0e5c5ea81a53a56
 * Topaz - 0x118ccb092c331eac2a18369102db4a58e1f1a0d7
 * Emerald - 0xf715d24f6924ca326fedfb78e7b4a99d3f7305be
 * Sapphire - 0xc0464049799024f02118d8cdb8cd4b858154707c
 * Amethyst - 0x2ef8b97424b11b9a956d91657604535a29b258e7
*/


/**
 * @dev CPX Token Registry 
 * Ties to the 7 CPX tokens 
 * Ropsten - 0x5fd219dada3ddd28be413ba02df001d9d4677454
 *
 */
contract TokenRegistry {
    address payable owner;
    address[] public Tokens;
    
    /**
     * @dev constructor
     * 
     * _tokens - array of token contract addresses 
     */
    constructor(address[] memory _tokens) public {
        owner = msg.sender;
        Tokens = _tokens;
    }
    
    /**
     * @dev Owner Functions 
     */
     /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == owner);
        //destroy
        selfdestruct(owner);
    }
    
    /**
     * @dev Set the Token function addresses 
     * _i - the index to replace
     * _token - the address
     */
    function setTokens (uint8 _i, address _token) public {
        require(msg.sender == owner);
        require(_i <= Tokens.length);
        if(_i == Tokens.length) Tokens.push(_token); 
        else Tokens[_i] = _token;
    }
    
    /**
     * @dev Get the number of Token contracts 
     * 
     */
    function getMax() public view returns(uint256) {
        return Tokens.length;
    }
}
