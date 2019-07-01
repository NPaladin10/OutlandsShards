#interface for Registry
contract Operator:
    def simpleMint(_i: uint256, _who: address, _amt: uint256): modifying
    def renounceMinter(): modifying

#interface for Plane NFT
contract PlaneNFT:
    def tokenExists(tokenId: uint256) -> bool: constant
    def ownerOf(tokenId: uint256) -> address: constant

# Events of the token.
Tap: event({plane: indexed(uint256), who: indexed(address)})

#base for hash 
random: string[64]
#cpx constants 
nCPX: uint256[8]
cpxMag: uint256[16]
#contracts 
nft: PlaneNFT
tO: Operator
#setup 
owner: address

#Cost and time
timeBetweenTaps: public(uint256)
nextTapTime: public(map(bytes32, uint256))

# Setup global variables
@public
def __init__():
    self.owner = msg.sender
    self.random = "OutlandsPlanes2019"
    self.nft = PlaneNFT(0x1526613135Cbe54EE257C11DD17254328A774f4a)
    self.tO = Operator(0x4AaDd213D8F3f34aD52154367dE033aDA429156A)
    self.nCPX = [1,1,1,1,2,2,2,3]
    self.cpxMag = [5,5,6,6,7,7,8,9,9,10,11,11,12,13,14,15]


#Kill the contract 
@public
def kill():
    assert(msg.sender == self.owner)
    #renounce minter 
    self.tO.renounceMinter()
    #kill and send owner balance
    selfdestruct(self.owner)


#Set time 
@public
def setTimeBetweenTaps(_time: uint256):
    assert(msg.sender == self.owner)
    self.timeBetweenTaps = _time
    

#Return the hash of the plane - based upon token id and base seed 
@constant
@public
def hash(tid: uint256) -> bytes32:
    #require existance
    assert(self.nft.tokenExists(tid))
    return keccak256(concat(keccak256(self.random), convert(tid, bytes32)))


#internal contract to mint CPX 
@private
def _mintCPX(_pOnwer: address, who: address, c: uint256, val: uint256): 
    #val goes from 10 to 20 
    base: uint256 = val * as_unitless_number(as_wei_value(1, "ether")) / 10
    #get variability 
    var: uint256 = convert(keccak256(concat(convert(as_unitless_number(block.timestamp), bytes32), convert(who, bytes32))), uint256) % 8
    #mint a token - 80 + var% to tap - who, 10 % to plane owner  
    self.tO.simpleMint(c, who, ((80 + var) * base) / 100)
    self.tO.simpleMint(c, _pOnwer, base / 10)
    self.tO.simpleMint(c, self.owner, base / 100)
    

@constant
@private
def _nCPX(_hash: bytes32) -> int128:
    _i: int128 = convert(slice(_hash, start=0, len=1), int128) % 8
    return convert(self.nCPX[_i], int128)
    

@constant
@public
def CPX(tid: uint256) -> uint256[6]:
    cpx: uint256[6]
    _hash: bytes32 = self.hash(tid)
    n: int128 = self._nCPX(_hash)
    ci: uint256
    mi: uint256
    mag: uint256
    #loop
    for i in range(3):
        if(i < n):
            ci = 1 + convert(slice(_hash, start=2*i, len=1), uint256) % 6
            cpx[2*i] = ci
            mi = convert(slice(_hash, start=(2*i)+1, len=1), uint256) % 16
            cpx[(2*i)+1] = self.cpxMag[convert(mi, int128)]
    
    return cpx


# Tap for color  
@public
def Tap(tid: uint256): 
    #check time 
    phash: bytes32 = self.hash(tid)
    assert(self.nextTapTime[phash] < as_unitless_number(block.timestamp))
    #get plane owner - it requires an owner
    pOwner: address = self.nft.ownerOf(tid)
    #update time 
    #have to convert to unitless 
    self.nextTapTime[phash] = as_unitless_number(block.timestamp) + self.timeBetweenTaps
    cpx: uint256[6] = self.CPX(tid)
    #loop
    for i in range(3):
        if(cpx[2*i] > 0):
            self._mintCPX(pOwner, msg.sender, cpx[2*i], cpx[(2*i)+1])
            
    #log
    log.Tap(tid, msg.sender)