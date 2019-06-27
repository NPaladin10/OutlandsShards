pragma solidity ^0.5.0;

import  "./CPX721.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

contract CosmicNFTOperator is MinterRole{
    address builder;
    CPX721[] Tokens;

    constructor() public {
        builder = msg.sender;
    }
    
    function addToken(string memory name, string memory symbol, string memory URL) public returns(address) {
        require(msg.sender == builder);
        uint256 n = Tokens.length;
        //create new token 
        Tokens.push(new CPX721(name, symbol, URL));
        return address(Tokens[n]);
    }
    
    function getTokenAdresses() public view returns(address[] memory list) {
        uint256 n = Tokens.length;
        list = new address[](n);
        for(uint256 i = 0; i < n; i++){
            list[i] = address(Tokens[i]);
        }
    }
    
    /**
     * @dev Pass through for external views 
     * Current Count
     */
    function currentID(uint256 i) public view returns(uint256) {
        return Tokens[i].currentID();
    }
    
    /**
     * @dev Pass through for external views 
     * Owner of an id 
     */
    function ownerOf(uint256 i, uint256 tokenId) public view returns(address) {
        return Tokens[i].ownerOf(tokenId);
    }
    
    /**
     * @dev Mint of a NFT  
     * 
     */
    function mint(uint256 _i, address _who) public onlyMinter returns(uint256 tokenId) {
        //require the token to be the next one 
        tokenId = Tokens[_i].currentID();
        Tokens[_i].mint(_who);
    }
    function mintWithURI(uint256 _i, address _who, string memory tokenURI) public onlyMinter returns(uint256 tokenId) {
        //require the token to be the next one 
        tokenId = Tokens[_i].currentID();
        Tokens[_i].mintWithTokenURI(_who, tokenURI);
    }
    
    /**
     * @dev Full Burn of a NFT
     * 
     */
    function burn(uint256 _i, uint256 _tokenID) public onlyMinter {
        Tokens[_i].burn(_tokenID);
    }
    
    /**
     * @dev Initiate transfer of token on anothers behalf 
     * 
     */
    function transferFrom(uint256 _i, address from, address to, uint256 _tokenID) public onlyMinter {
        Tokens[_i].safeTransferFrom(from, to, _tokenID);
    }
}