const ethers = require('ethers');

//Load ethereum
const provider = ethers.getDefaultProvider('ropsten')
const wallet = new ethers.Wallet('superSecretKey', provider)
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
  OutlandsTrouble : {
    abi : [
      "function currentPeriod() public view returns(uint256)",
      "function countOfChallenges() public view returns(uint256)",
      "function activeChallenges(uint256) public view returns (address,uint256,uint256[])",
      "function nextPeriod() public",
      "function reward(uint256[] ids, uint256[2][] cpx, uint256[6][] xp, bytes32[] hash) public",
      "function addCooldown(uint256[] hi, uint256[] cool) public"
    ],
    address : "0x38E24687e779c49FCd0d8e00bEcbea95Dd126C61"
  },
}

const outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,wallet)
const outlandsHeroes = new ethers.Contract(CPXContracts.OutlandsHeroes.address,CPXContracts.OutlandsHeroes.abi,wallet)
const outlandsTrouble = new ethers.Contract(CPXContracts.OutlandsTrouble.address,CPXContracts.OutlandsTrouble.abi,wallet)

module.exports = {
  provider, outlandsPlanes, outlandsHeroes, outlandsTrouble,
  utils : ethers.utils
}
