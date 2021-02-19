/*
    Gatekeeper.sol
    V0.2
    SPDX-License-Identifier: MIT
*/ 
pragma solidity ^0.6.0;

import "./CPXToken1155.sol";
import "./RarityCalculator.sol";
import "./Pausable.sol";

contract NFTKeeper is PausableCPX {
    // Create roles 
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");
    
    //Gatekeeper
    Gatekeeper internal GK;
    
    //ID 
    uint256 public NFTID;
    //does the Gatekeeper need to call mint 
    bool public callMint = true;
    
    constructor (Gatekeeper gk, uint256 nft) 
        public
    {
        GK = gk;
        NFTID = nft;
        
        //grants role to Gatekeeper
        _setupRole(MINTER_ROLE, address(gk));
    }
    
    /*
        internal
        function to interact with Gatekeeper
    */
    function _getSeed (uint256 id) 
        internal
        view
        returns (bytes32)
    {
        return GK.getSeed(id);
    }
    
    /*
        view 
    */
    
    //look for owner 
    function isOwnerOf (address player, uint256 id) 
        public
        view
        returns (bool)
    {
        return GK.balanceOf(player, id) == 1; 
    }
    
    function getCount ()
        public
        view
        returns (uint256)
    {
        return GK.countOfNFT(NFTID);
    }
    
    /*
        virtual for override
    */
    
    function mint (uint256 id, bytes calldata data) public virtual returns (bytes memory) {}
    
    /*
        external 
        Stat control 
    */
    function setStat (uint256 id, uint256 i, int256 val) 
        public
        returns (int256)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        return GK.setStat(id, i, val); 
    }
    
    function setStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals) 
        public
        returns (int256[] memory)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        return GK.setStatBatch(id, si, _vals);
    }
    
    function modStat (uint256 id, uint256 i, int256 val) 
        public
        returns (int256)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        return GK.modStat(id, i, val);
    }
    
    function modStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals) 
        public
        returns (int256[] memory vals)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        return GK.modStatBatch(id, si, _vals);
    }
}

/*
    Deployed 
    Local 0.1 - 0xCD8899dc6Ea7542a1c97C9B71ac4AbC8E91Df471
    Local 0.2 - 0x257C9B613dE179b22e8639ba23819c7dF716A141
    Goerli 0.1 0xF988ea224f4Dd6F73d4857D32C1F43375E7b15c4 -  (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/

contract Gatekeeper is PausableCPX, RarityCalculator {
    //IDs 
    uint256 public constant NFT_ID = 0;

    // Create roles 
    //0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    //0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    //0x3a5b873628a2c49bf313473942acc8932f6f84c76b74bf3db0e4d8b51277a623
    bytes32 public constant NFT_MINTER_ROLE = keccak256("NFT_MINTER_ROLE");
    //0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    //contracts 
    CPXToken1155 internal CPX1155;
    
    //collect NFT data   
    mapping (uint256 => uint256) public countOfNFT;

    //keeps stats for NFTs 
    mapping (uint256 => address) internal _keepers;
    mapping (uint256 => mapping (uint256 => int256)) internal _stats;

    /*
        Events 
    */
    event StatChange (address indexed operator, uint256 indexed id, uint256 stat, int256 val);
    event StatChangeBatch (address indexed operator, uint256 indexed id, uint256[] stats, int256[] vals);

    //constructor
    constructor(CPXToken1155 _cpx1155)
        public
    {
        CPX1155 = _cpx1155;
    }
    
    function setContract (CPXToken1155 _cpx) 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        CPX1155 = _cpx;
    }
    
    /*
        1155 functions 
        balanceOf(account, id)
        balanceOfBatch(accounts, ids)
        mint(to, id, amount, data)
        mintBatch(to, ids, amounts, data)
        burn(account, id, value)
        burnBatch(account, ids, values)
    */
    
    /*
        internal  
    */
    
    function _getSeed (uint256 _id) 
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(address(this), uint256(_stats[_id][NFT_ID]), _id));
    } 
    
    /*
        internal calls to 1155 mint functions 
        used by external mint function 
    */
    
    function _mint (address to, uint256 id, uint256 amount) 
        internal
    {
        require(!_isPaused, "Contract is paused.");
        CPX1155.mint(to, id, amount, "");
    }
    
    function _mintBatch (address to, uint256[] calldata ids, uint256[] calldata amounts) 
        internal
    {
        require(!_isPaused, "Contract is paused.");
        CPX1155.mintBatch(to, ids, amounts, "");
    }

    /*
        external view functions to pass on 1155 data 
        contracts only need to reference this contrct, not both 
    */
    
    function balanceOf (address account, uint256 id)
        public
        view
        returns (uint256)
    {
        return CPX1155.balanceOf(account,id);
    }
    
    function balanceOfBatch (address[] calldata accounts, uint256[] calldata ids)
        public
        view
        returns (uint256[] memory)
    {
        return CPX1155.balanceOfBatch(accounts, ids);
    }
    
    //look for owner 
    function isOwnerOf (address player, uint256 id) 
        public
        view
        returns (bool)
    {
        return balanceOf(player, id) == 1; 
    }
    
    /*
        view functions for unique token data  
    */
    
    function isNFT (uint256 id) 
        public
        view
        returns (bool)
    {
        return _stats[id][NFT_ID] != 0; 
    }
    
    function getNFTId (uint256 id) 
        public
        view
        returns (uint256)
    {
        return uint256(_stats[id][NFT_ID]);
    }
    
    function getNFT (uint256 id) 
        public
        view
        returns (address keeper, uint256 nftId, bytes32 seed)
    {
        return (_keepers[id], getNFTId(id), _getSeed(id));
    }
    
    function getSeed (uint256 id) 
        public
        view
        returns (bytes32)
    {
        return _getSeed(id);
    }
    
    function getStat (uint256 id, uint256 i) 
        public
        view
        returns (int256 val)
    {
        return _stats[id][i];
    }
    
    function getStatBatch (uint256 id, uint256[] calldata si)
        public
        view 
        returns (int256[] memory vals)
    {
        //set returns
        vals = new int256[](si.length);
        //loop
        for(uint256 i = 0; i < si.length; i++){
            vals[i] = _stats[id][si[i]];
        }
    }
    
    function getStatsOfBatch (uint256[] calldata ids, uint256[] calldata si)
        public
        view 
        returns (int256[] memory vals)
    {
        //set returns
        uint256 l = si.length;
        vals = new int256[](ids.length * si.length);
        //loop
        for(uint256 i = 0; i < ids.length; i++){
            for(uint256 j = 0; j < si.length; j++) {
                vals[j + (l * i)] = _stats[ids[i]][si[j]];
            }
        }
    }
    
    /*
        external mint and burn functions 
        single point of interface 
    */
    
    function _burn (uint256 id) 
        internal
    {
        //check for nft 
        if(isNFT(id)) {
            _stats[id][NFT_ID] = 0; 
        }
    }
    
    function burnBatch (address player, uint256[] calldata ids, uint256[] calldata amounts) 
        public
    {
        require(hasRole(BURNER_ROLE, msg.sender), "No permission.");
        CPX1155.burnBatch(player, ids, amounts);
        
        //internal nft reset 
        for(uint256 i = 0; i < ids.length; i++) {
            _burn(ids[i]);
        }
    }
    
    function burn (address player, uint256 id, uint256 amount) 
        public
    {
        require(hasRole(BURNER_ROLE, msg.sender), "No permission.");
        CPX1155.burn(player, id, amount);
        
        //check internal
        _burn(id);
    }
    
    /*
        For NFT 
    */
    function mintNFT (address player, uint256 nft, address keeper, bytes calldata data)
        public
        returns (uint256 id)
    {
        require(hasRole(NFT_MINTER_ROLE, msg.sender), "No permission.");
        
        //grants role to keeper 
        _setupRole(SETTER_ROLE, keeper);
        
        //create id 
        id = ++countOfNFT[nft] + nft;

        //mapping
        _keepers[id] = keeper;
        _stats[id][NFT_ID] = int256(nft);

        //mint 
        _mint(player, id, 1);
        
        //check to call mint on keeper 
        if(NFTKeeper(keeper).callMint()) {
            NFTKeeper(keeper).mint(id, data);
        }
    }
    
    /*
        For fungible 
    */
    
    function mintBatch (address player, uint256[] calldata ids, uint256[] calldata amounts) 
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");

        _mintBatch(player, ids, amounts);
    }
    
    function mint (address player, uint256 id, uint256 amount) 
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        _mint(player, id, amount);
    }
    
    /*
        external 
        Stat control 
    */
    function setStat (uint256 id, uint256 i, int256 val) 
        public
        returns (int256)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        _stats[id][i] = val;
        
        emit StatChange (msg.sender, id, i, val);
        return val; 
    }
    
    function setStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals) 
        public
        returns (int256[] memory)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        
        for(uint256 i = 0; i < si.length; i++){
            _stats[id][si[i]] = _vals[i];
        }
        
        emit StatChangeBatch (msg.sender, id, si, _vals);
        return _vals; 
    }
    
    function modStat (uint256 id, uint256 i, int256 val) 
        public
        returns (int256)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        _stats[id][i] += val;
        
        emit StatChange (msg.sender, id, i, _stats[id][i]);
        return _stats[id][i];
    }
    
    function modStatBatch (uint256 id, uint256[] calldata si, int256[] calldata _vals) 
        public
        returns (int256[] memory vals)
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");
        
        //init return 
        uint256 l = si.length;
        vals = new int256[](l);
        
        for(uint256 i = 0; i < l; i++){
            //set stat 
            _stats[id][si[i]] += _vals[i];
            
            //set return
            vals[i] =  _stats[id][si[i]];
        }
        
        emit StatChangeBatch (msg.sender, id, si, vals);
    }
}