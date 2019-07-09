/* Contract Data 
*/

let CPXContracts = {
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
      "function cooldown(uint256 ti) public view returns(uint256)",
      "function currentPeriod() public view returns(uint256)",
      "function timeBetweenPeriods() public view returns(uint256)",
      "function costToChallenge() public view returns(uint256)",
      "function countOfChallenges() public view returns(uint256)",
      "function getChallengeById(uint256) public view returns (address,uint256,uint256[])",
      "function submitChallenge(uint256 ti, uint256[] heroes) public payable"
    ],
    address : "0xd524382CA0F6826e078a442DA7092dE3E1460bcB"
  },
  CPX : {
    abi : [
      "function balanceOf(address account) external view returns (uint256)",
      "function authorizeOperator(address operator) external",
      "function isOperatorFor(address operator, address tokenHolder) external view returns (bool)",
      "function operatorBurn(address account, uint256 amount,bytes data,bytes operatorData) external"
    ],
    address : [
      "0xc7a70cb917673db93053f08504e0a7ff74cdd387",
      "0x03bcdd8051bd8ac2182892302cf9307d9bf7ad06",
      "0x67b3d1bc921864da467d465de0e5c5ea81a53a56",
      "0x118ccb092c331eac2a18369102db4a58e1f1a0d7",
      "0xf715d24f6924ca326fedfb78e7b4a99d3f7305be",
      "0xc0464049799024f02118d8cdb8cd4b858154707c",
      "0x2ef8b97424b11b9a956d91657604535a29b258e7"
      ]
  }
}


/* Ethers Provider
*/
let block = null, network = null;
let provider = null, signer = null, wallet = null;
if (typeof web3 !== 'undefined') {
    provider = new ethers.providers.Web3Provider(web3.currentProvider)
    signer = provider.getSigner()
} else {
    provider = ethers.getDefaultProvider('ropsten')
    /*
    //find a signer if stored 
    let lastSigner = localStorage.getItem("lastSigner")
    //if nothing is stored - create wallet and save 
    if(!lastSigner) {
      wallet = ethers.Wallet.createRandom()
      localStorage.setItem(wallet.address, wallet.mnemonic)  
      localStorage.setItem("lastSigner",wallet.address)
    }
    else {
      //pull wallet from mnemonic
      let mnemonic = localStorage.getItem(lastSigner)  
      wallet = ethers.Wallet.fromMnemonic(mnemonic)
      signer = wallet.connect(provider)
    }
    */
}
provider.getNetwork().then(n=> { network = n})
provider.getBlock ( "latest" ).then(b => { block = b })

//handle the contracts - connect with the signer / provider 
let whoSends = signer ? signer : provider
let outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,whoSends)
let outlandsHeroes = new ethers.Contract(CPXContracts.OutlandsHeroes.address,CPXContracts.OutlandsHeroes.abi,whoSends)
let outlandsTrouble = new ethers.Contract(CPXContracts.OutlandsTrouble.address,CPXContracts.OutlandsTrouble.abi,whoSends)

const check = (app) => {
  let {UIMain,utils,tokensPlanes,tokensHeroes,planets,heroChallengeCooldown} = app
  if(network && block) {
    provider.getNetwork().then(n=> { network = n})
    //set data for later
    provider.getBlock ( "latest" ).then(b => { block = b })

    if (typeof web3 !== 'undefined') {
      signer = provider.getSigner()
    }

    //get range of tokens 
    outlandsPlanes.totalSupply().then(n => {
      n = n.toNumber()
      let pids = d3.range(n).map(i => i).filter(i => !tokensPlanes.has(i))
      //now pull data 
      pids.forEach(i => utils.addPlaneData(i, planets, tokensPlanes))
    })

    //get challenge period 
    outlandsTrouble.currentPeriod().then(p => UIMain.currentPeriod = p.toNumber()) 

    //get data from tap 
    if(UIMain.tid > -1) {
      //outlandsPlanes.nextTapTime(planeHash(UIMain.pid, UIMain.sid)).then(t => UIMain.nextTap = t.toNumber())
      
    }
  }

  //scan for CPX
  if(UIMain && signer) {
    let address = UIMain.address
    //cost 
    outlandsPlanes.costToSearch().then(c => UIMain.searchCost = ethers.utils.formatEther(c))
    outlandsHeroes.costToRecruit().then(c => UIMain.recruitCost = ethers.utils.formatEther(c))
    outlandsTrouble.costToChallenge().then(c => UIMain.challengeCost = ethers.utils.formatEther(c))

    signer.getAddress().then(a => {
        if(a != UIMain.address) {
          UIMain.address = a  
          //redo contracts 
          outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,signer)
          outlandsHeroes = new ethers.Contract(CPXContracts.OutlandsHeroes.address,CPXContracts.OutlandsHeroes.abi,signer)
        }
      })
      //get the eth balance  
      signer.getBalance().then(b => {
        UIMain.balance = ethers.utils.formatEther(b).slice(0,5)
      }) 

    if(address !="") {
      outlandsPlanes.tokensOfOwner(address).then(T => {
        //log of Token ids 
        UIMain.owns = T.map(ti => ti.toNumber())
      })

      //pull hero data 
      outlandsHeroes.tokensOfOwner(address).then(T => {
        T = T.map(ti => ti.toNumber())
        //check for challenge cooldown
        T.forEach(ti => {
          outlandsTrouble.cooldown(ti).then(cool => {
            heroChallengeCooldown.set(ti,cool.toNumber())
          })
        })
        //log of Token ids 
        let owns = T.filter(i => !tokensHeroes.has(i))
        //now get data 
        owns.forEach(i => {
          //res = [pi,hash]
          outlandsHeroes.Heroes(i).then(res => {
            tokensHeroes.set(i,utils.heroData(i,res[0].toNumber(),res[1],tokensPlanes))
            //set data for UIMain
            UIMain.heroIds = [...tokensHeroes.keys()]
          })
        })
      })

      //look if there is shares to claim 
      outlandsHeroes.fundsReceived(address).then(s => UIMain.shareToClaim = ethers.utils.formatEther(s))

      //time 
      outlandsPlanes.nextSearchTime(address).then(t => UIMain.nextSearch = t.toNumber())
      //pull recruit time
      if(UIMain.tid>-1) outlandsHeroes.nextRecruitTime(UIMain.tid).then(t => UIMain.nextRecruit = t.toNumber())
    }
  }  
}

const getContracts = () => {
    return {outlandsPlanes,outlandsHeroes,outlandsTrouble}
}

export {
    check,
    getContracts
}