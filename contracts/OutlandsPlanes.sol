//Manages the Planes of the Outlands.
pragma solidity ^0.5.0;

/**
 * @dev Outlands: Planes are Shards of Planets
 * Ropsten - 0x1604981a1d3b8672a14fac5ceef827d8a213b1d0
 *
 */
contract OutlandsPlanes {
    /**
     * @dev Basic Search structure.
     * 
     * last: time the last search was performed
     * await: block the search must wait for
     * planet: planet of the search
     */
    struct Search {
        uint256 next;
        uint256 await;
        uint256 planet;
    }
    
    event FailedSearch (address indexed who, uint256 indexed planet);  
    event PlaneFound (address indexed who, uint256 indexed planet, uint256 shard);
    
    /**
     * @dev Globals
     */
    address payable owner;
    //hash seed
    string seed = "OutlandsPlanes2019";
    //number of active planets 
    uint256 public planetCap;
    //number of planes found by planet - max of 32 
    mapping (uint256 => address[]) internal _finders;
    //cost to search 
    uint256 public searchCost = 100 * 1 finney;
    //time between searches 
    uint256 searchTime = 3600;
    mapping (address => Search) public searchData;
    
    /**
     * @dev constructor
     * 
     * _cap: maximum number of planets allowed to search
     */
    constructor(uint256 _cap) public {
        owner = msg.sender;
        planetCap = _cap;
    }
    
    /**
     * @dev View functions 
     */
     
    /**
     * @dev Generates Planet hash based upon seed and planet id 
     * 
     * _planet: planet id
     */
    function planetHash (uint256 _planet) public view returns(bytes32 hash) {
        hash = keccak256(abi.encodePacked(seed,_planet)); 
    }
    /**
     * @dev Generates Plane hash based planet and shard id 
     * 
     * _planet: planet id
     * _shard: shard id
     */
    function planeHash (uint256 _planet, uint256 _shard) public view returns(bytes32 hash) {
        hash = keccak256(abi.encodePacked(planetHash(_planet),_shard)); 
    }
    /**
     * @dev Returns True/Flase if a plane has been found by a address
     * 
     * _planet: planet id
     * _shard: shard id
     */
    function isFound (uint256 _planet, uint256 _shard) public view returns(bool) {
        return getFinder(_planet,_shard) != address(0); 
    }
    /**
     * @dev Returns the address of who found the plane
     * shard 0 is always found by the owner 
     * 
     * _planet: planet id
     * _shard: shard id
     */
    function getFinder (uint256 _planet, uint256 _shard) public view returns(address) {
        //check if above _cap
        if(_planet > planetCap) return address(0);
        //first shard is owner
        if(_shard == 0) return owner;
        //modify id - player shards are 1-31
        uint256 _id = _shard-1;
        if(_id >= _finders[_planet].length) return address(0);
        return _finders[_planet][_id]; 
    }
    /**
     * @dev Returns any array of all finders for a planet 
     * 
     * _planet: planet id
     */
    function getAllFinders (uint256 _planet) public view returns(address[] memory) {
        return _finders[_planet]; 
    }
    /**
     * @dev Returns maximum number of shards from a planet 
     * Above this number there are only islands or the maelstrom
     * 
     * _planet: planet id
     */
    function maxShards (uint256 _planet) public view returns(uint256 nShards) {
        bytes32 hash = planetHash(_planet);
        nShards = 1 + uint8(hash[0]) % 32;
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
        selfdestruct(owner);
    }
    /**
     * @dev Sets the maximum number of planets in the Outlands
     * 
     * _cap: the new maximum number of planets to create shards from
     */
    function setPlanetCap (uint256 _cap) public {
        require(msg.sender == owner);
        planetCap = _cap;
    }
    /**
     * @dev Sets search cost
     * 
     * _cost: the new cost to search
     */
    function setSearchCost (uint256 _cost) public {
        require(msg.sender == owner);
        searchCost = _cost;
    }
    /**
     * @dev Sets the minimum time between searches for an address
     * 
     * _time: the time in seconds
     */
    function setSearchTime (uint256 _time) public {
        require(msg.sender == owner);
        searchTime = _time;
    }
    
    /**
     * @dev Before a player can search they must pay for the search
     * Allows for randomization because they do not know the upcomming hash
     * There are only 32 shards in any planet 
     * A player must wait the search time 
     * Sets the search Struct for the player
     * 
     * _planet: the id of the planet the search originates from 
     */
    function payForSearch (uint256 _planet) public payable returns(uint256 await){
        require(_finders[_planet].length < 32);
        require(msg.value >= searchCost);
        //have to wait for search time 
        require(_planet < planetCap && searchData[msg.sender].next < now);
        //send value 
        owner.transfer(address(this).balance);
        //update can seacrh 
        searchData[msg.sender].await = block.number+1;
        searchData[msg.sender].planet = _planet;
        await = searchData[msg.sender].await; 
    }
    
    /**
     * @dev Conducts the search the player paid for
     * Player must wait until the following block to conduct 
     * If they waited too long they are allowed a redo
     * Resets their search data 
     * 
     * Uses the hash to pick a number between 0 and 31
     * If greater than the currently number of found shards, finds a new shard
     * It becomes harder and harder to find a shard 
     * 
     * New shards are linked to the player address
     */
    function conductSearch () public {
        //get await block 
        uint256 aB = searchData[msg.sender].await;
        //await block cannot be 0
        require( aB != 0);
        //has to be less than the current block
        if(aB > block.number) return;
        else if (block.number - aB > 256) {
            //catch values outside of bounds 
            searchData[msg.sender].await = block.number+1;
            return;
        }
        //now go
        //reset to 0 set time 
        searchData[msg.sender].await = 0;
        searchData[msg.sender].next = now+searchTime;
        //check hash for success 
        bytes32 hash = keccak256(abi.encodePacked(blockhash(aB),msg.sender));
        uint256 search = uint8(hash[0]) % 32;
        //check if less than than found
        uint256 _planet  = searchData[msg.sender].planet;
        //increment if new shard found - cannot be found previous - gets harder every time
        if(_finders[_planet].length < search) {
            _finders[_planet].push(msg.sender); 
            //emit 
            emit PlaneFound(msg.sender,_planet,_finders[_planet].length);
        }
        else {
            emit FailedSearch(msg.sender,_planet);
        }
    }
} 
