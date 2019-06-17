# Defining the planes of the outlands
# Broken down into regions 
# Gen - 0xbc4e464f489c74978b8def438d37a62236a26add
# Ropsten - 0x4d8b51ebe8c8b127a28236e867fa0e56319c266e 

#interface for Plane Data Generator 
contract PlaneGen:
    def maxShards(pi: uint256) -> uint256: constant
    def planeHash(pi: uint256, si: uint256) -> bytes32: constant


# Events of the token.
NewPlane: event({planet: indexed(uint256), shard: uint256, finder: indexed(address)})
FailedSearch: event({region: indexed(uint256), player: indexed(address)})

#Geography
_regions: map(uint256, uint256[33])
shardCount: public(map(uint256,uint256))
_finders: map(bytes32, address)
#Keep the total count of found planes 
_cap: uint256
_totalCount: uint256

#Cost and time
costToSearch: public(uint256)
timeBetweenSearches: public(uint256)
nextSearchTime: public(map(address, uint256))

#Core Setup 
owner: address
seed: string[32]
random: uint256
Gen: PlaneGen
CPX: address[7]


# Setup global variables
@public
def __init__(_gen: address):
  self.owner = msg.sender
  self.random = convert(msg.sender, uint256)
  self._cap = 32 
  #One finney 
  self.costToSearch = 10**15
  #setup gen contract
  self.Gen = PlaneGen(_gen)
  

#Set time 
@public
def setTimeBetweenSearches(_time: uint256):
    assert(msg.sender == self.owner)
    self.timeBetweenSearches = _time
    

#Set cost 
@public
def setCostToSearch(_cost: uint256):
    assert(msg.sender == self.owner)
    self.costToSearch = _cost


#Give region information   
@public
@constant
def regionData(ri: uint256) -> uint256[33]:
    return self._regions[ri]


#Give total plane count    
@public
@constant
def totalCount() -> uint256:
    return self._cap + self._totalCount


#Provide the finder of a plane of a plane  
@public
@constant
def planeFinder(pi: uint256, si: uint256) -> address:
    if(pi > self._cap):
        return ZERO_ADDRESS
    if(si == 0):
        return self.owner
    return self._finders[self.Gen.planeHash(pi,si)]


# Create the regions - owner only 
@public
def editRegion(ri: uint256, data: uint256[33], cap: uint256): 
    assert(msg.sender == self.owner)
    self._regions[ri] = data
    #loop to look for cap 
    if(cap > self._cap):
        self._cap = cap


#Conduct search 
@payable
@public
def search(ri: uint256) -> (uint256, uint256):
    assert(self._regions[ri][0] != 0)
    assert(msg.value >= self.costToSearch)
    assert(self.nextSearchTime[msg.sender] < as_unitless_number(block.timestamp))
    #update time 
    #have to convert to unitless 
    self.nextSearchTime[msg.sender] = as_unitless_number(block.timestamp) + self.timeBetweenSearches
    #generate the random hash
    hash: bytes32 = sha3(concat(convert(self.random,bytes32),convert(msg.sender,bytes32),convert(block.timestamp,bytes32)))
    #set hash to what was generateed 
    self.random = convert(hash,uint256)
    #determine lecth of modulo to use for planet 
    length: uint256
    planet: uint256
    if(self._regions[ri][2] == 0): 
        length = self._regions[ri][1] - self._regions[ri][0]
        #planet is calculated 
        planet = self._regions[ri][0] + convert(slice(hash, start=0, len=1) ,uint256) % length
    else: 
        length = self._regions[ri][0]
        #planet comes from array 
        idx: uint256 = 1+convert(slice(hash, start=0, len=1) ,uint256) % length
        planet = self._regions[ri][convert(idx,int128)] 
    #determine shard 
    shard: uint256 = convert(slice(hash, start=1, len=1), uint256) % 32 
    if(self.shardCount[planet] < self.Gen.maxShards(planet) and shard > self.shardCount[planet]):
        #increase counts 
        self.shardCount[planet] = self.shardCount[planet]+1
        self._totalCount = self._totalCount+1
        #set finder 
        self._finders[self.Gen.planeHash(planet, self.shardCount[planet])] = msg.sender
        log.NewPlane(planet,self.shardCount[planet],msg.sender)
        return(planet, self.shardCount[planet])
    else:
        log.FailedSearch(ri, msg.sender)
        return(0,0)
