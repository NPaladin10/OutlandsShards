# Allow the PLanes to be tapped for cosmic 
# Ropsten -  0xF4fB24395C346916C27b1E3B3b3FDaC1E2c79664 

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
shardCount: public(map(uint256, uint256))
_idToPlane: map(uint256, uint256[2])
_planeToID: map(bytes32, uint256)
#Keep the total cap of planets 
cap: public(uint256)
_start: uint256
_currentId: uint256

#Cost and time
costToSearch: public(uint256)
timeBetweenSearches: public(uint256)
nextSearchTime: public(map(address, uint256))
timeBetweenTaps: public(uint256)
nextTapTime: public(map(bytes32, uint256))

#Core Setup 
owner: address
paused: bool
Gen: PlaneGen
Reg: Registry
NFT: PlaneNFT

# Setup global variables
@public
def __init__():
  self.owner = msg.sender
  self.cap = 32
  self.paused = False 
  #One finney 
  self.costToSearch = 10**15
  #setup contracts - Ropsten 
  self.Gen = PlaneGen(0x3dd41e473656F8fe1907987334E89a3Bb422C2Eb)
  self.Reg = Registry(0xeD20801CED01693C12B876921039e30bEd5F8B8d)
  self.NFT = PlaneNFT(0xC6B43DfbE2acB52ee930f13a1a36E0F871F0320B)
  #detemine starting index 
  self._start = self.NFT.currentID()
  self._currentId = self._start


#internal contract to mint NFT and update token/planes 
@private
def _mint(who: address, pi: uint256): 
    #mint a new NFT  
    tid: uint256 = self.Reg.mintNFT(0, who)
    self._currentId = tid 
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
    #get variability 
    var: uint256 = convert(sha3(concat(convert(as_unitless_number(block.timestamp), bytes32), convert(who, bytes32))), uint256) % 8
    #mint a token - 80 + var% to tap - who, 10 % to plane owner  
    self.Reg.simpleMintToken(c, who, ((80 + var) * base) / 100)
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


@public
def pause():
    assert(msg.sender == self.owner)
    if(self.paused):
        self.paused = False 
    else:
        self.paused = True 
    

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
    

#Set Planet Cap  
@public
def setPlanetIdCap(_cap: uint256):
    assert(msg.sender == self.owner)
    self.cap = _cap


#Set time 
@public
def setTimeBetweenSearches(_time: uint256):
    assert(msg.sender == self.owner)
    self.timeBetweenSearches = _time


#Set time 
@public
def setTimeBetweenTaps(_time: uint256):
    assert(msg.sender == self.owner)
    self.timeBetweenTaps = _time
    

#Set cost 
@public
def setCostToSearch(_cost: uint256):
    assert(msg.sender == self.owner)
    self.costToSearch = _cost


#Give total plane count    
@public
@constant
def tokenRange() -> (uint256, uint256):
    return (self._start, self._currentId)


#Give total shard count of planet array    
@public
@constant
def shardArray(pi: uint256[32]) -> uint256[32]:
    nS: uint256[32]
    for i in range(32):
        nS[i] = self.shardCount[pi[i]]
    return nS


#Provide the finder of a 
@public
@constant
def planeOwner(pi: uint256, si: uint256) -> address:
    if(pi == 0 or pi > self.cap):
        return ZERO_ADDRESS
    if(si == 0):
        return self.owner
    if(si > self.shardCount[pi]):
        return ZERO_ADDRESS
    else:
        phash: bytes32 = self.Gen.planeHash(pi, si)
        tid: uint256 = self._planeToID[phash]
        return self.NFT.ownerOf(tid)


#Provide the finder and tokenId of a plane 
@public
@constant
def planeToToken(pi: uint256, si: uint256) -> (address, uint256):
    if(pi == 0 or pi > self.cap):
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
    assert(ti >= self._start and ti <= self._currentId)
    p: uint256[2] = self._idToPlane[ti]
    return (p[0],p[1])


@public
@constant
def tokenToPlaneArray(ti: uint256[32]) -> (uint256[64]):
    t: uint256
    p: uint256[64]
    for i in range(32):
        t = ti[i]
        p[i], p[i+32] = self.tokenToPlane(t)
    return p


# Tap for color  
@public
def Tap(pi: uint256, si: uint256): 
    assert(pi > 0)
    assert(not self.paused)
    #check time 
    phash: bytes32 = self.Gen.planeHash(pi, si)
    assert(self.nextTapTime[phash] < as_unitless_number(block.timestamp))
    #get plane owner 
    pOwner: address = self.planeOwner(pi, si)
    #must have an owner 
    assert(pOwner != ZERO_ADDRESS)
    #update time 
    #have to convert to unitless 
    self.nextTapTime[phash] = as_unitless_number(block.timestamp) + self.timeBetweenTaps
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
    assert(not self.paused)
    #must be in cap  
    assert(pi > 0 and pi < self.cap)
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