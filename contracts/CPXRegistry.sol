pragma solidity ^0.5.0;

import "./ICPX777.sol";
import "./ICPX721.sol";
import "github.com/OpenZeppelin/openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

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
 * Ropsten ERC721 
 * Outlands Planes Registrar - 0xD034d78D123F2F6873E056C6A9A0FCA78c676b8A
 */

/**
 * @dev CPX Token Registry 
 * Ties to the 7 CPX tokens 
 * Ties to the NFT 
 * Allows for single source mint and burn 
 * 
 * Ropsten - 0xe6CB29fE412B38872DF5c838Eb35EddD917B1AAB
 *
 */
contract CPXRegistry is MinterRole {
    address payable owner;
    uint256 random;
    address[] _tokens;
    address[] _nfts;
    
    /**
     * @dev constructor
     * 
     * _tokens - array of token contract addresses 
     */
    constructor() public {
        owner = msg.sender;
        random = uint256(keccak256(abi.encodePacked(msg.sender, now)));
        
        //Ropsten push
        _tokens.push(0xC7a70CB917673dB93053f08504e0A7Ff74Cdd387); 
        _tokens.push(0x03bCdd8051BD8Ac2182892302CF9307D9Bf7AD06); 
        _tokens.push(0x67b3d1bC921864da467D465De0e5C5Ea81A53a56);
        _tokens.push(0x118cCb092C331eAC2a18369102db4a58e1F1A0d7);
        _tokens.push(0xF715D24F6924CA326FedfB78e7b4a99d3F7305BE);
        _tokens.push(0xc0464049799024f02118d8CDB8cd4B858154707c);
        _tokens.push(0x2ef8b97424b11B9A956D91657604535A29B258E7);
        
        _nfts.push(0xD034d78D123F2F6873E056C6A9A0FCA78c676b8A);
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
        //renounce minter 
        uint256 nt = _tokens.length;
        uint256 nnft = _nfts.length;
        uint256 i = 0;
        //renounce minter 
        for(i = 0; i < nt; i++) {
            if(ICPX777(_tokens[i]).isMinter(address(this))) ICPX777(_tokens[i]).renounceMinter();
        }
        for(i = 0; i < nnft; i++) {
            if(ICPX721(_nfts[i]).isMinter(address(this))) ICPX721(_nfts[i]).renounceMinter();
        }
        //destroy
        selfdestruct(owner);
    }
    
    /**
     * @dev What tokens are linked  
     */
    function registeredTokens() public view returns(address[] memory tokens, address[] memory nfts) {
        tokens = _tokens;
        nfts = _nfts;
    }
    
    /**
     * @dev Does this token have minting rights  
     */
    function isTokenMinter() public view returns(bool[] memory tokens, bool[] memory nfts) {
        //set arrays 
        uint256 nt = _tokens.length;
        tokens = new bool[](nt);
        uint256 nnft = _nfts.length;
        nfts = new bool[](nnft);
        uint256 i = 0;
        //check for minter 
        for(i = 0; i < nt; i++) {
            tokens[i] = ICPX777(_tokens[i]).isMinter(address(this));
        }
        for(i = 0; i < nnft; i++) {
            nfts[i] = ICPX721(_nfts[i]).isMinter(address(this));
        }
    }
    
    /**
     * @dev Is this approved to burn for sender  
     * If not they will need to approve this contract 
     */
    function isApproved(address user) public view returns(bool allApproved) {
        //master approval 
        allApproved = true;
        //set arrays 
        uint256 nt = _tokens.length;
        uint256 nnft = _nfts.length;
        uint256 i = 0;
        //check for approval  
        for(i = 0; i < nt; i++) {
            allApproved = allApproved && ICPX777(_tokens[i]).isOperatorFor(address(this), user) ? true : false;
        }
        for(i = 0; i < nnft; i++) {
            allApproved = allApproved && ICPX721(_nfts[i]).isApprovedForAll(user, address(this)) ? true :false;
        }
    }
    
    /**
     * @dev Add the token function addresses 
     * _i - the index to replace
     * _token - the address
     */
    function setTokens (uint256 _i, address _token, bool isNFT) public returns(address[] memory){
        require(msg.sender == owner);
        if(isNFT) {
            if(_i < _nfts.length) _nfts[_i] = _token;
            else _nfts.push(_token);
            
            return _nfts;
        }
        else {
            if(_i < _tokens.length) _tokens[_i] = _token;
            else _tokens.push(_token);
            
            return _tokens;
        }
    }
    
    /**
     * @dev Get the number of Token contracts 
     * 
     */
    function getMax() public view returns(uint256,uint256) {
        return(_tokens.length, _nfts.length);
    }
    
    /**
     * @dev Simple Mint of a token  
     * Calls mint with no bytes of extra data 
     * 
     */
    function simpleMintToken(uint256 _i, address _who, uint256 _amt) public onlyMinter {
        bytes memory noData;
        ICPX777(_tokens[_i]).mint(address(this), _who, _amt, noData, noData);
    }
    
    /**
    * @dev Standard Mint of a token  
    * 
    */
    function mintToken(uint256 _i, address _who, uint256 _amt, bytes memory _data, bytes memory _opData) public onlyMinter {
        ICPX777(_tokens[_i]).mint(address(this), _who, _amt, _data, _opData);
    }
    
    /**
     * @dev Simple Mint of a NFT  
     * 
     */
    function mintNFT(uint256 _i, address _who) public onlyMinter returns(uint256 tokenId) {
        //require the token to be the next one 
        tokenId = ICPX721(_nfts[_i]).currentID();
        ICPX721(_nfts[_i]).mint(_who);
    }
    
    /**
     * @dev Full Burn of a token with data 
     * 
     */
    function burnToken(uint256 _i, address _who, uint256 _amt, bytes memory _data, bytes memory _opData) public onlyMinter {
        ICPX777(_tokens[_i]).operatorBurn(_who, _amt, _data, _opData);
    }
    function simpleBurnToken(uint256 _i, address _who, uint256 _amt) public onlyMinter {
        bytes memory noData;
        burnToken(_i, _who, _amt, noData, noData);
    }
    
    /**
     * @dev Full Burn of a NFT
     * 
     */
    function burnNFT(uint256 _i, uint256 _tokenID) public onlyMinter {
        ICPX721(_nfts[_i]).burn(_tokenID);
    }
    
    /**
     * @dev Combine CPX colors to make Diamond
     * 
     */
    function makeDiamond(uint256 _amt) public {
        //must be approved 
        require(isApproved(msg.sender));
        uint8 i = 0;
        //loop to ensure balance 
        for(i = 1; i < 7; i++) {
            require(ICPX777(_tokens[i]).balanceOf(msg.sender) >= _amt);
        }
        //now burn the colors 
        for(i = 1; i < 7; i++) {
            simpleBurnToken(i, msg.sender, _amt);
        }
        //now keep amount
        //owner gets 1%
        simpleMintToken(0, owner, _amt / 100);
        //amount is variable
        bytes32 hash = keccak256(abi.encodePacked(random, now, msg.sender));
        random = uint256(hash);
        uint8 vp = uint8(hash[0]) % 16;
        uint256 pamt = _amt * (75+vp)/100;
        //mint
        simpleMintToken(0, msg.sender, pamt / 100);
    }
}
