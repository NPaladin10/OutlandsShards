# Allow the Creation of Units - linked to planes 
# Ropsten - 0x4AaDd213D8F3f34aD52154367dE033aDA429156A

#interface for Plane Data Generator 
contract PlaneGen:
    def planeHash(pi: uint256, si: uint256) -> bytes32: constant

#interface for Plane NFT
contract OutlandsPlanes:
    def planeOwner(pi: uint256, si: uint256) -> address: constant

#interface for Registry
contract Registry:
    def simpleBurnToken(_i: uint256, _who: address, _amt: uint256): modifying
    def mintNFT(_i: uint256, _who: address) -> uint256: modifying
    def renounceMinter(): modifying

#interface for Plane NFT
contract PlaneNFT:
    def currentID() -> uint256: constant
    def ownerOf(tokenId: uint256) -> address: constant

# Events of the token.
NewUnit: event({planet: indexed(uint256), owner: indexed(address), id: uint256})

#Record units 
#planet and color 
unitRegistry: map(uint256, uint256[2])
#state 
_start: uint256
_currentId: uint256

#Cost and time
costToCreate: public(uint256)
timeBetweenRecruit: public(uint256)
nextRecruitTime: public(map(bytes32, uint256))

#Core Setup 
owner: address
paused: bool
Gen: PlaneGen
Reg: Registry
OP: OutlandsPlanes
NFT: PlaneNFT

# Setup global variables
@public
def __init__():
  self.owner = msg.sender
  self.paused = False 
  #One Half CPXD 
  self.costToCreate = 5 * 10**17
  #setup contracts - Ropsten 
  self.Gen = PlaneGen(0x3dd41e473656F8fe1907987334E89a3Bb422C2Eb)
  self.Reg = Registry(0x3B54797E3E34461C1d3C7A56631c0ffa2E02b4aB)
  self.OP = OutlandsPlanes(0xF4fB24395C346916C27b1E3B3b3FDaC1E2c79664)
  self.NFT = PlaneNFT(0x3496f8F96c230E6f03eECe73521cAe0C81879700)
  #detemine starting index 
  self._start = self.NFT.currentID()
  self._currentId = self._start


#internal contract to mint NFT and update token/planes 
@private
def _mint(who: address, pi: uint256, color: uint256): 
    #mint a new NFT  
    tid: uint256 = self.Reg.mintNFT(1, who)
    self._currentId = tid 
    self.unitRegistry[tid] = [pi,color]
    #log 
    log.NewUnit(pi, who, tid)


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
    if(_i == 3):
        self.OP = OutlandsPlanes(_a)
    

#Set time 
@public
def setTimeBetweenRecruit(_time: uint256):
    assert(msg.sender == self.owner)
    self.timeBetweenRecruit = _time


#Set cost 
@public
def setCostToCreate(_cost: uint256):
    assert(msg.sender == self.owner)
    self.costToCreate = _cost


#Give total plane count    
@public
@constant
def tokenRange() -> (uint256, uint256):
    return (self._start, self._currentId)


#Get unit data 
@public
@constant
def getUnitData(tokenId: uint256) -> (uint256, uint256):
    #must be in range 
    if(tokenId < self._start or tokenId > self._currentId): 
        return (0,0)
    u: uint256[2] = self.unitRegistry[tokenId]
    return (u[0],u[1])


#Conduct search 
#needs planet and shard 
@public
def recruit(pi: uint256, si: uint256, color: uint256):
    assert(not self.paused)
    assert(color >= 1 and color <= 6)
    #get hash for reference 
    hash: bytes32 = self.Gen.planeHash(pi, si)
    assert(self.nextRecruitTime[hash] < as_unitless_number(block.timestamp))
    #get owner 
    pOwner: address = self.OP.planeOwner(pi, si)
    #must have an owner 
    assert(pOwner != ZERO_ADDRESS)
    #burn cost in Diamond
    #this asserts in the burn function 
    self.Reg.simpleBurnToken(0, msg.sender, self.costToCreate)
    #burn cost in color 
    self.Reg.simpleBurnToken(color, msg.sender, 10**18)
    #now set time 
    self.nextRecruitTime[hash] = as_unitless_number(block.timestamp) + self.timeBetweenRecruit
    #mint 
    self._mint(msg.sender, pi, color)