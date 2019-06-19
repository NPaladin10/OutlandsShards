# Defining the planes of the outlands
# Broken down into regions 
# Ropsten - 0x94616B1E5cadD4A3993ff3Ca5D5815547d5ABbBC

#interface for Plane Data Generator 
contract PlaneGen:
    def maxShards(pi: uint256) -> uint256: constant
    def planeHash(pi: uint256, si: uint256) -> bytes32: constant

#interface for Plane NFT
contract PlaneNFT:
    def currentID() -> uint256: constant
    def ownerOf(tokenId: uint256) -> address: constant

#interface for Registry
contract Registry:
    def mintNFT(_i: uint256, _who: address) -> uint256: modifying
    def renounceMinter(): modifying

# Events of the token.
NewPlane: event({planet: indexed(uint256), shard: uint256, finder: indexed(address)})
FailedSearch: event({region: indexed(uint256), player: indexed(address)})

#Geography
_regions: map(uint256, uint256[33])
shardCount: public(map(uint256, uint256))
_idToPlane: map(uint256, uint256[2])
_planeToID: map(bytes32, uint256)
#Keep the total cap of planets 
_cap: uint256
_start: uint256

#Cost and time
costToSearch: public(uint256)
timeBetweenSearches: public(uint256)
nextSearchTime: public(map(address, uint256))

#Core Setup 
owner: address
seed: string[32]
random: uint256
Gen: PlaneGen
Reg: Registry
NFT: PlaneNFT

# Setup global variables
@public
def __init__():
  self.owner = msg.sender
  self.random = convert(msg.sender, uint256)
  self._cap = 32 
  #One finney 
  self.costToSearch = 10**15
  #setup contracts - Ropsten 
  self.Gen = PlaneGen(0xBC4e464f489c74978b8DeF438D37a62236A26add)
  self.Reg = Registry(0x5BB1a3E7ED4566aE9Ac02372bdD777245A6CcBa5)
  self.NFT = PlaneNFT(0x72ab0A4eA9E64FcFCC154d55b8777A7ad8383F65)
  #detemine starting index 
  self._start = self.NFT.currentID()


#internal contract to mint NFT and update token/planes 
@private
def _mint(who: address, pi: uint256): 
    #mint a new NFT  
    tid: uint256 = self.Reg.mintNFT(0, who)
    #increase shard count 
    self.shardCount[pi] = self.shardCount[pi]+1
    si: uint256 = self.shardCount[pi]
    #set data for memory later 
    self._idToPlane[tid] = [pi, si]
    self._planeToID[self.Gen.planeHash(pi, si)] = tid 
    #log
    log.NewPlane(pi, si, who)


#Kill the contract 
@public
def kill():
    assert(msg.sender == self.owner)
    #renounce minter 
    self.Reg.renounceMinter()
    #kill and send owner balance
    selfdestruct(self.owner)


#Set Contract Reference Address
@public
def setContractAddress(_i: uint256, _a: address):
    assert(msg.sender == self.owner)
    if(_i == 0):
        self.Gen = PlaneGen(_a)
    if(_i == 1):
        self.Reg = Registry(_a)
    if(_i == 2):
        self.NFT = PlaneNFT(_a)
    

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
    return self._cap + self.NFT.currentID() - self._start


#Provide the finder and tokenId of a plane 
@public
@constant
def planeToToken(pi: uint256, si: uint256) -> (address, uint256):
    if(pi > self._cap):
        return (ZERO_ADDRESS, 0)
    if(si == 0):
        return (self.owner, 0)
    if(si > self.shardCount[pi]):
        return (ZERO_ADDRESS, 0)
    else:
        phash: bytes32 = self.Gen.planeHash(pi, si)
        tid: uint256 = self._planeToID[phash]
        return (self.NFT.ownerOf(tid), tid)


#Provide the plane of a tokenId  
@public
@constant
def tokenToPlane(ti: uint256) -> (uint256, uint256):
    assert(ti >= self._start)
    assert(ti < self.NFT.currentID())
    p: uint256[2] = self._idToPlane[ti]
    return (p[0],p[1])


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
def search(ri: uint256) -> bool:
    assert(self._regions[ri][0] != 0)
    assert(msg.value >= self.costToSearch)
    assert(self.nextSearchTime[msg.sender] < as_unitless_number(block.timestamp))
    #send owner balance
    send(self.owner, self.balance)
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
    #check if planet can have more shards and that the random shard picked is greater than the current count 
    if(self.shardCount[planet] < self.Gen.maxShards(planet) and shard > self.shardCount[planet]):
        self._mint(msg.sender, planet)
        return True
    else:
        log.FailedSearch(ri, msg.sender)
        return False