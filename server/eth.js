const keys = require('./keys');
const ethers = require('ethers');

//Load ethereum
const provider = ethers.getDefaultProvider('ropsten')
const wallet = new ethers.Wallet(keys.ropsten, provider)
console.log("Linked to address: "+wallet.address)
wallet.getBalance().then(b => {
  console.log("Balance: "+ethers.utils.formatEther(b))  
})


/* Contract Data 
*/

const CPXContracts = {
  OutlandsPlanes : {
    abi : [
      "event NewPlane (address indexed finder, uint256 i)",
      "function costToSearch() public view returns(uint256)",
      "function timeBetweenSearches() public view returns(uint256)",
      "function nextSearchTime(address) public view returns(uint256)",
      "function totalSupply() public view returns(uint256)",
      "function tokensOfOwner(address owner) external view returns (uint256[])",
      "function Search() public payable", 
    ],
    address : "0xa8Af2e26488a02A4653687f71EFA212a2001e7a2"
  },
  OutlandsHeroes : {
    abi : [
      "event NewHero (address indexed finder, uint256 indexed plane, uint256 i)",
      "function costToRecruit() public view returns(uint256)",
      "function timeBetweenRecruit() public view returns(uint256)",
      "function nextRecruitTime(uint256) public view returns(uint256)",
      "function fundsReceived(address) public view returns(uint256)",
      "function ownerOf(uint256 id) public view returns(address)",
      "function Heroes(uint256) public view returns(uint256,bytes32)",
      "function totalSupply() public view returns(uint256)",
      "function tokensOfOwner(address owner) external view returns (uint256[])",
      "function Recruit(uint256 pi) public payable",
      "function withdrawFundsReceived() public",
      "function withdrawToBank() public"
    ],
    address : "0xeBEF6F1ffc0c97a83FB136F9D45f81a6E471B4B8"
  },
  OutlandsTrouble: {
    abi : [
      "event NewChallenge (bytes32 id, uint256 period, address indexed player, uint256 indexed plane, uint256[] heroes)",
      "event CompleteChallenge (bytes32 id, bytes32 hash, uint256[] pxp)",
      "function cooldown(uint256 ti) public view returns(uint256)",
      "function currentPeriod() public view returns(uint256)",
      "function timeBetweenPeriods() public view returns(uint256)",
      "function costToChallenge() public view returns(uint256)",
      "function completedChallenges(bytes32) public view returns (bool)",
      "function complete(bytes32 id, bytes32 hash, address player, uint256[2] cpx, uint256[] heroes, uint256[] xp, uint256[] pxp, uint256[] cool)",
      "function submitChallenge(uint256 plane, uint256[] heroes) public payable"
    ],
    address : "0x478788C4fCA61190D3fE3147A1844577571220B3",
  },
  OutlandsXP : {
    abi : [
      "function activeXP(uint256) public view returns(uint256, uint256)"
    ],
    address : "0x58E2671A70F57C1A76362c5269E3b1fD426f43a9"
  },
  OutlandsHeroCooldown : {
    abi : [
      "function cooldown(uint256) public view returns(uint256)"
    ],
    address : "0x0152Cf49360eed5B35c170081Ee8aC0e5c1e2e7C"
  },
}

const outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,wallet)
const outlandsHeroes = new ethers.Contract(CPXContracts.OutlandsHeroes.address,CPXContracts.OutlandsHeroes.abi,wallet)
const outlandsTrouble = new ethers.Contract(CPXContracts.OutlandsTrouble.address,CPXContracts.OutlandsTrouble.abi,wallet)
const outlandsXP = new ethers.Contract(CPXContracts.OutlandsXP.address,CPXContracts.OutlandsXP.abi,wallet)

//log check function - searches log back 256 block for a topic releveant to an address
const logCheck = (cAddress, topic, bn) => {
    return new Promise((resolve, reject) => {
      if(!bn) reject('No blockNumber')

      let filter = {
          address: cAddress,
          fromBlock: bn,
          toBlock: bn,
          topics: [ topic ]
      }
      provider.getLogs(filter).then(resolve)  
    })
}

//Sign data and then send the sig - hash will be re-created in Solidity for security
const signData = (types,data) => {
    return new Promise((res,reject) => {
        let msgHash = ethers.utils.solidityKeccak256(types, data)
        //add Reqd ethereum signing stamp - mod msg to get correct hash 
        let ethHash = ethers.utils.solidityKeccak256(['string','bytes32'],["\x19Ethereum Signed Message:\n32",msgHash])
        //But sign the original msg - The 66 character hex string MUST be converted to a 32-byte array first!
        let binaryData = ethers.utils.arrayify(msgHash);    
        //sign 
        signer.getAddress().then(address => {
            signer.signMessage(binaryData).then(sig => res({address,msgHash,ethHash,sig}))  
        })
    }) 
}

//validate a message
const validateMessage = (hash, sig) => {
  //correct representation of hash 
  //The 66 character hex string MUST be converted to a 32-byte array first!
  let binaryData = ethers.utils.arrayify(hash)    
  return ethers.utils.verifyMessage(binaryData,sig)
}

module.exports = {
  provider, validateMessage, signData, outlandsPlanes, outlandsHeroes, outlandsTrouble, outlandsXP,
  logCheck,
  utils : ethers.utils
}
