pragma solidity ^0.5.0;

import "github.com/NPaladin10/OutlandsShards/contracts/MinterControlToken1155.sol";

/**
 * @dev CPX Token Registry 
 * Ties to the 7 CPX tokens 
 * Allows for single source mint and burn 
 * Kovan - 0x1083F9E5Df0Debdf7Ec0a52580ad612F41465A04
 */
contract CosmicRegistry is MinterRole {
    //events 
    event FundsWithdrawn (address indexed who, uint256 amt);
    //link to Tokens
    MinterControlToken1155 OT;
    //Token type 
    uint256[7] public tokenId;
    
    //core 
    address admin;
    address payable bank;

    //contrtuctor - set name and symbol
    constructor () public {
        admin = msg.sender;
        bank = msg.sender;
        //set token 
        OT = MinterControlToken1155(0x303435cf43478b61F25D6fa8909a7418E1b6E3Ec);
    }
    
    /**
     * @dev Owner Functions 
     */
     /**
     * @dev Kill function
     * Destroys the contract
     */
    function kill () public {
        require(msg.sender == admin);
        //renounce minter 
        if(OT.isMinter(address(this))) OT.renounceMinter();
        //destroy
        selfdestruct(bank);
    }
    
    //initiate the token 
    function init() public {
        require(msg.sender == admin && tokenId[0] == 0);
        //send the URI and it is an NFT 
        tokenId[0] = OT.create("https://outlandsplanes.appspot.com/cpx/cpd",false);
        tokenId[1] = OT.create("https://outlandsplanes.appspot.com/cpx/cpr",false);
        tokenId[2] = OT.create("https://outlandsplanes.appspot.com/cpx/cpg",false);
        tokenId[3] = OT.create("https://outlandsplanes.appspot.com/cpx/cpt",false);
        tokenId[4] = OT.create("https://outlandsplanes.appspot.com/cpx/cpe",false);
        tokenId[5] = OT.create("https://outlandsplanes.appspot.com/cpx/cps",false);
        tokenId[6] = OT.create("https://outlandsplanes.appspot.com/cpx/cpa",false);
    }
    
    /**
     * @dev Set Bank 
     */
    function setBank(address payable _bank) public {
        require(msg.sender == admin);
        bank = _bank;
    }
    
    /**
     * @dev Get all the CPX of an address 
     * 
     */
    function getCPX(address account) public view returns(uint256[7] memory cpx) {
        //loop to get balance 
        for(uint8 i = 0; i < 7; i++) {
            cpx[i] = OT.balanceOf(account,tokenId[i]);
        }
    }
    function getBatchCPX(address[] memory account) public view returns(uint256[7][] memory cpx) {
        uint256 n = account.length;
        //loop to get all balances 
        for(uint256 i = 0; i < n; i++) {
            cpx[i] = getCPX(account[i]);
        }
    }
    
    /**
     * @dev Mint of a Token   
     */
    function mint(uint256 _i, address[] memory _who, uint256[] memory _amt) public onlyMinter {
        OT.mintFungible(tokenId[_i],_who,_amt);
    }


    /**
     * @dev Burn a token 
     * 
     */
    function burn(address _from, uint256[] memory _ids, uint256[] memory _values) public onlyMinter {
        OT.safeBatchBurnFrom(_from, _ids, _values);
    }

    /**
     * @dev Combine CPX colors to make Diamond
     * 
     */
     function _burnColors(address _from, uint256 _value) internal {
        //loop 
        for(uint256 i = 1; i < 7; i++){
            OT.burnFrom(_from,tokenId[i],_value);
        }
    }
    function makeDiamond(uint256 _amt) public {
        //now burn the colors - there is a require in the burn function to check balance 
        _burnColors(msg.sender, _amt);
        //now establish array 
        address[] memory _who = new address[](2);
        uint256[] memory _values = new uint256[](2);
        //bank gets 1%
        _who[0] = bank;
        _values[0] = _amt/100;
        //take care of player 
        _who[1] = msg.sender;
        bytes32 hash = keccak256(abi.encodePacked(OT.totalBalance(0), now, msg.sender));
        //amount to player is variable
        uint8 vp = uint8(hash[0]) % 16;
        _values[1] = (75+vp) * _amt /100;
        //mint 
        OT.mintFungible(tokenId[0],_who,_values);
    }
}
