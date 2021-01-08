/*
    OutlandsRegions.sol
    v0.4
    
    SPDX-License-Identifier: MIT
*/ 
pragma solidity ^0.6.0;

import "./Gatekeeper.sol";

/*
    Deployed 
    local 0.2 - 0x23F91D9F1E0799ac4159a37E813Bc449C294Ade2
    local 0.3 - 0x4d3DdB25D111371b384b133DcE48D3c4Ba9EB18b
    local 0.4 - 0xeB4141432F26D9d14743F3AF15cD301Ea8cE5443
    Goerli 0.1 - 0xd6fDb4Ed121c0F081F873E33Ced4752BE0379AC6 (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
    Goerli 0.2 - 0x4141fbe02e62aD6D5ddA658D3a4d30d0C18Aa98e (admin 0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c)
*/
contract OutlandsRegions is NFTKeeper {
    //IDs 
    uint256 public constant REALM_ID = 1;

    //hold anchors 
    mapping (uint256 => uint8[]) internal _anchors;

    //Events 
    event Mint(uint256 id, int256 realm, uint8[] anchors);

    //constructor
    constructor(Gatekeeper gk)
        public
        NFTKeeper(gk, 10**9 + 10**6)
    {
        callMint = false;
    }
    
    bool _initComplete = false;
    
    function init () 
        public
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No permission.");
        require(!_initComplete, "Already done.");
        
        int256[16] memory _realms = [int256(1),1,1,1,1,1,1,2,2,2,3,3,4,4,4,4];
        uint8[] memory _a = new uint8[](1);
        
        uint256[16] memory _ids;
        for(uint256 i = 0; i < 16; i++){
            _ids[i] = GK.mintNFT(msg.sender, NFTID, address(this), "");
            _setRegion(_ids[i], _realms[i], _a);
        }
        
        //now set anchors individually
        _anchors[_ids[0]] = [1,1,2,2,3,3,3,3,3,4,4,4,5,5,5,5];
        _anchors[_ids[1]] = [1,1,1,1,2,2,2,2,3,3,4,4,5,5,5,5];
        _anchors[_ids[2]] = [1,1,2,2,2,3,3,3,3,3,4,4,4,5,5,5];
        _anchors[_ids[3]] = [1,1,2,2,2,2,3,3,3,4,4,5,5,5,5,5];
        _anchors[_ids[4]] = [1,1,2,2,2,2,3,3,4,4,5,5,5,5,5,5];
        _anchors[_ids[5]] = [1,1,2,2,2,2,3,3,4,4,5,5,5,5,5,5];
        _anchors[_ids[6]] = [1,1,1,1,2,2,2,2,2,3,4,5,5,5,5,5];
        _anchors[_ids[7]] = [1,2,2,2,3,3,3,3,3,4,4,5,5,5,5,5];
        _anchors[_ids[8]] = [1,1,2,2,2,2,3,3,3,4,4,4,5,5,5,5];
        _anchors[_ids[9]] = [1,2,2,2,3,3,3,3,4,4,5,5,5,5,5,5];
        _anchors[_ids[10]] = [1,1,1,1,2,2,3,3,4,4,4,4,5,5,5,5];
        _anchors[_ids[11]] = [1,1,2,2,2,2,3,3,4,4,4,5,5,5,5,5];
        _anchors[_ids[12]] = [1,1,2,2,2,2,3,3,4,4,4,5,5,5,5,5];
        _anchors[_ids[13]] = [1,1,1,1,2,2,2,2,2,3,4,5,5,5,5,5];
        _anchors[_ids[14]] = [1,1,1,2,2,2,3,3,3,3,4,4,4,5,5,5];
        _anchors[_ids[15]] = [1,1,1,1,1,2,2,2,2,3,3,4,5,5,5,5];
        
        _initComplete = true;
    }
    
    /*
        internal set function   
    */
    function _setRegion (uint256 _id, int256 _realm, uint8[] memory _a) 
        internal
    {
        require(!_isPaused, "Contract is paused.");
        require(_realm > 0, "Cannot assign realm 0.");
        
        //set data
        //function setStat (uint256 id, uint256 i, int256 val) 
        GK.setStat(_id, REALM_ID, _realm);
        _anchors[_id] = _a;
    }
    
    /*
        external mint / set  
    */
    
    function setRegion (uint256 _id, int256 _realm, uint8[] calldata _a) 
        public
    {
        require(hasRole(SETTER_ROLE, msg.sender), "No permission.");

        //set
        _setRegion(_id, _realm, _a);
    }
    
    function mintRegion (int256 _realm, uint8[] calldata _a, address player) 
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "No permission.");
        
        //mintNFT (address player, uint256 nft, address keeper, bytes calldata data)
        uint256 id = GK.mintNFT(player, NFTID, address(this), "");
        
        //set
        _setRegion(id, _realm, _a);

        //emit
        emit Mint(id, _realm, _a);
    }
    
    /*
        internal generators for view 
    */
    
    /*
        region data 
        (uint256 r, uint8[] a)
    */
    
    function _getRealm (uint256 id) 
        internal
        view
        returns (int256 r)
    {
        return GK.getStat(id, REALM_ID);
    }
    
    function _getData (uint256 id) 
        internal
        view
        returns (int256 r, uint8[] memory a)
    {
        return (_getRealm(id), _anchors[id]);
    }
    
    function _genAnchorFromSeed (bytes32 seed, uint8[] memory _a)
        internal
        pure
        returns (uint8 a)
    {
        //anchor
        uint256 n = _a.length;
        return _a[uint8(seed[1]) % n];        
    }
    
    /*
        view  
    */
    
    function getRegion (uint256 id) 
        public
        view
        returns (int256 r, uint8[] memory a)
    {
        
        return _getData(id);
    }
    
    function getRegionRealm (uint256 id) 
        public
        view
        returns (int256 r)
    {
        
        return _getRealm(id);
    }
    
    /*
        random region depending upon current region count 
        - thus it may change if regions are added 
    */
    function genRegionFromSeed (bytes32 seed)
        public
        view
        returns (uint256 id)
    {
        return NFTID + 1 + (uint256(seed) % getCount());
    }
    
    //provides the whole region data from a seed
    function getRegionFromSeed (bytes32 seed)
        public
        view
        returns (uint256 id, int256 r, uint8[] memory a)
    {
        id = genRegionFromSeed(seed);
        (r, a) = getRegion(id); 
    }
    
    //generates a shard from a given seed 
    function genShardFromSeed (bytes32 seed) 
        public
        view
        returns (uint256 r, uint8 a)
    {
        r = genRegionFromSeed(seed);
        a = _genAnchorFromSeed(seed, _anchors[r]);
    }
}