// Gatekeeper.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CPX721.sol";
import "./Pausable.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);
    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);
    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/*
    Deployed 
    Goerli - 0x54664cF49fF978D9A1548395b0000BCAA15B13AA
*/

//"1000000000000000000"
//0x0000000000000000000000000000000000000000

contract Gatekeeper is PausableCPX {

    //control nft contracts and creation cost 
    struct NFT {
        CPX721 nft_token;
        address cost_token;
        uint256 cost;
        uint256[] stats;
    }
    //collect NFT data available for sale    
    mapping (uint256 => NFT) internal nfts;
    
    //Events 
    event Withdrawn(address indexed payee, address token, uint256 weiAmount);

    //constructor
    constructor() {}
    
    function setNFT (uint256 id, CPX721 nft_token, address cost_token, uint256 cost, uint256[] calldata stats) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Gatekeeper, setNFT: No permission.");
        nfts[id] = NFT(nft_token, cost_token, cost, stats);
    }
    
    function getNFTData (uint256 id) 
        public
        view
        returns (address, address, uint256 cost, uint256[] memory stats)
    {
        return (address(nfts[id].nft_token), address(nfts[id].cost_token), nfts[id].cost, nfts[id].stats);
    }
    
    /*
        Admin withdraws funds from contract
    */
    function withdraw(address token) 
        public 
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Gatekeeper, withdraw: Not ADMIN");
        
        //check for which balance
        uint256 bal;
        if(token == address(0)) {
            bal = address(this).balance;
            //set payable 
            address payable payee = payable(msg.sender);
            //send to payee
            payee.transfer(bal);
        }
        else {
            bal = IERC20(token).balanceOf(address(this));
            //transfer 
            IERC20(token).transfer(msg.sender, bal);
        }
        
        //emit 
        emit Withdrawn(msg.sender, token, bal);
    }
    
    /*
        Mint 
        freedom to allow players to mint as long as they pay the cost
        provide the initial stats for making the nft unique 
    */ 
    
    function mint (uint256 nft, int256[] calldata _vals) 
        public
        payable
    {
        NFT memory _NFT = nfts[nft];
        //cost 
        uint256 cost = _NFT.cost;
        require(!paused(), "Gatekeeper, Mint: Contract is paused.");
        require(cost > 0, "Gatekeeper, Mint: NFT does not exist.");
        require(_NFT.stats.length == _vals.length, "Gatekeeper, Mint: Stat number mismatch.");
        
        //now ensure payment
        if(address(_NFT.cost_token) == address(0)){
            require(msg.value >= cost, "Gatekeeper, Mint: Must pay to mint.");
        }
        else {
            require(IERC20(_NFT.cost_token).transferFrom(msg.sender, address(this), cost), "Gatekeeper, Mint: Not enough token to mint.");
        }
        
        //nft token 
        CPX721 _token = _NFT.nft_token;
        //call mint 
        _token.mint(msg.sender);
        //get id 
        uint256 id = _token.totalSupply() - 1;
        //set stats
        if(_vals.length > 0) _token.setStatBatch(id, nfts[nft].stats, _vals);
    }
}