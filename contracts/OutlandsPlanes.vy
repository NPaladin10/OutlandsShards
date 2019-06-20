# Defining the planes of the outlands
# Broken down into regions 
# Ropsten - 

#interface for Plane Data Generator 
contract PlaneGen:
    def maxShards(pi: uint256) -> uint256: constant
    def planeHash(pi: uint256, si: uint256) -> bytes32: constant
    def cpxColors(pi: uint256, si: uint256) -> (uint256, uint256, uint256): constant
    def cpxVals(pi: uint256, si: uint256) -> (uint256, uint256, uint256): constant

#interface for Plane NFT
contract PlaneNFT:
    def currentID() -> uint256: constant
    def ownerOf(tokenId: uint256) -> address: constant

#interface for Registry
contract Registry:
    def simpleMintToken(_i: uint256, _who: address, _amt: uint256): modifying
    def mintNFT(_i: uint256, _who: address) -> uint256: modifying
    def renounceMinter(): modifying

# Events of the token.
NewPlane: event({planet: indexed(uint256), shard: uint256, finder: indexed(address)})
Tap: event({planet: indexed(uint256), shard: uint256, who: indexed(address)})
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
timeBetweenTaps: public(uint256)
nextTapTime: public(map(bytes32, uint256))

#Core Setup 
owner: address
seed: string[32]
Gen: PlaneGen
Reg: Registry
NFT: PlaneNFT

# Setup global variables
@public
def __init__():
  self.owner = msg.sender
  self._cap = 32 
  #One finney 
  self.costToSearch = 10**15
  #setup contracts - Ropsten 
  self.Gen = PlaneGen(0x713F4E0Eb1247Dfab6f4Da58256fC6B7Fc6941fD)
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
    

#internal contract to mint CPX 
@private
def _mintCPX(_pOnwer: address, who: address, c: uint256, val: uint256): 
    #val goes from 10 to 20 
    base: uint256 = val * as_unitless_number(as_wei_value(1, "ether")) / 10
    #mint a token - 89% to tap - who, 10 % to plane owner  
    self.Reg.simpleMintToken(c, who, (89 * base) / 10)
    self.Reg.simpleMintToken(c, _pOnwer, base / 10)
    self.Reg.simpleMintToken(c, self.owner, base / 100)


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
def regionData(ri: uint256) -> uint256[64]:
    rs: uint256[64]
    if(self._regions[ri][0] == 0):
        return rs 
    pi: uint256
    if(self._regions[ri][2] == 0):
        d: uint256 = self._regions[ri][1]-self._regions[ri][0]
        start: uint256 = self._regions[ri][0]
        for i in range(32):
            pi = start+convert(i,uint256)
            rs[i] = pi
            rs[i+32] = self.shardCount[pi]
    else: 
        for i in range(32):
            pi = self._regions[ri][i+1]
            rs[i] = pi
            rs[i+32] = self.shardCount[pi]
    return rs


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


# Tap for color  
@public
def Tap(pi: uint256, si: uint256): 
    #check time 
    phash: bytes32 = self.Gen.planeHash(pi, si)
    assert(self.nextTapTime[phash] < as_unitless_number(block.timestamp))
    #update time 
    #have to convert to unitless 
    self.nextTapTime[phash] = as_unitless_number(block.timestamp) + self.timeBetweenTaps
    #get plane owner 
    tokenId : uint256
    pOwner : address
    pOwner, tokenId = self.planeToToken(pi, si)
    c: uint256[3]
    v: uint256[3]
    c[0], c[1], c[2] = self.Gen.cpxColors(pi, si)
    v[0], v[1], v[2] = self.Gen.cpxVals(pi, si)
    #loop
    for i in range(3):
        if(v[i] > 0):
            self._mintCPX(pOwner, msg.sender, c[i], v[i])
            
    #log
    log.Tap(pi, si, msg.sender)
        

#Conduct search 
@payable
@public
def search(pi: uint256):
    #must be in cap  
    assert(pi < self._cap)
    #check shard count 
    assert(self.shardCount[pi] < self.Gen.maxShards(pi))
    #must pay 
    assert(msg.value >= self.costToSearch)
    #can only search every so often 
    assert(self.nextSearchTime[msg.sender] < as_unitless_number(block.timestamp))
    #send owner balance
    send(self.owner, self.balance)
    #update time 
    #have to convert to unitless 
    self.nextSearchTime[msg.sender] = as_unitless_number(block.timestamp) + self.timeBetweenSearches
    ##mint 
    self._mint(msg.sender, pi)
    #log
    log.NewPlane(pi, self.shardCount[pi], msg.sender)
