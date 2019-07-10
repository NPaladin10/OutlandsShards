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
  OutlandsXP : {
    abi : [
      "function activeXP(uint256) public view returns(uint256, uint256)"
    ],
    address : "0x58E2671A70F57C1A76362c5269E3b1fD426f43a9"
  },
  OutlandsTrouble: {
    abi : [
      "event NewChallenge (bytes32 id, uint256 period, address indexed player, uint256 indexed plane, uint256[] heroes)",
      "function cooldown(uint256 ti) public view returns(uint256)",
      "function currentPeriod() public view returns(uint256)",
      "function timeBetweenPeriods() public view returns(uint256)",
      "function costToChallenge() public view returns(uint256)",
      "function completedChallenges(bytes32) public view returns (bool)",
      "function setCooldown(uint256[] hi, uint256[] cool) public",
      "function reward(bytes32 id, address player, uint256[2] cpx, uint256[] heroes, uint256[] xp, bytes32 hash)",
      "function submitChallenge(uint256 plane, uint256[] heroes) public payable"
    ],
    address : "0x19cbef19f311A28a7407D3e1b52410Fde0739659"
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

module.exports = {
  provider, outlandsPlanes, outlandsHeroes, outlandsTrouble, outlandsXP,
  logCheck,
  utils : ethers.utils
}
