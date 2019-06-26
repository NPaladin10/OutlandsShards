//chance
import "../lib/chance.min.js"

/* Utilities 
*/
const hashToDecimal = (_hash, _id) => {
  //0x ofset
  let id = _id+1
  return parseInt(_hash.slice(id*2,(id*2)+2),16)
}

/* Hash Functions 
  Used for seeding and random generation  
*/
const seed = "OutlandsPlanes2019"

const planetHash = (_planet) => {
  return ethers.utils.solidityKeccak256(['string', 'uint256'], [seed, _planet]) 
}
const planeHash = (_planet, _shard) => {
  return ethers.utils.solidityKeccak256(['bytes32', 'uint256'], [planetHash(_planet), _shard]) 
}
const maxShards = (_planets) => {
  return _planets.map(pid => 1+(hashToDecimal(planetHash(pid),0) % 32))
}
const planeCPX = (_planet, _shard) => {
  let cpxMag = [10,10,11,11,12,12,13,14,14,15,16,16,17,18,19,20]
  //CPX based on hash
  let _hash = planeHash(_planet, _shard)
  //number of CPX
  let _cpxI = hashToDecimal(_hash,1) % 8
  let nCPX = [1,1,1,1,1,2,2,3][_cpxI]
  //if shard number greater than max - only 1 CPX
  if(_shard == 0 && nCPX < 3) nCPX++;
  //designate array - 6 colors of CPX
  return d3.range(nCPX).map(i => {
    return [1 + hashToDecimal(_hash,i+2) % 6, cpxMag[hashToDecimal(_hash,i+5) % 16]]
  })
}

/* Contract Data 

*/

let CPXContracts = {
  PlaneGen : {
    abi : [
      "function maxShardArray(uint256[] memory pis) public view returns(uint256[] max)", 
    ],
    address : "0x3dd41e473656F8fe1907987334E89a3Bb422C2Eb"
  },
  OutlandsPlanes : {
    abi : [
      "event Tap (uint256 indexed planet, uint256 shard, address indexed who)", 
      "event NewPlane (uint256 indexed planet, uint256 shard, address indexed finder)",
      "function costToSearch() public view returns(uint256)",
      "function timeBetweenSearches() public view returns(uint256)",
      "function timeBetweenTaps() public view returns(uint256)",
      "function nextSearchTime(address) public view returns(uint256)",
      "function nextTapTime(bytes32) public view returns(uint256)",
      "function tokenRange() public view returns(uint256, uint256)",
      "function shardArray(uint256[32] pi) public view returns(uint256[32])", 
      "function tokenToPlane(uint256 ti) public view returns(uint256,uint256)", 
      "function planeToToken(uint256 pi, uint256 si) public view returns(address, uint256)", 
      "function Tap(uint256 pi, uint256 si) public", 
      "function search(uint256 pi) public payable", 
    ],
    address : "0xF4fB24395C346916C27b1E3B3b3FDaC1E2c79664"
  },
  CPXRegistry : {
    abi : [
      "function isApproved(address account) external view returns (bool)",
      "function getCPX(address account) external view returns (uint256[7] cpx)",
      "function makeDiamond(uint256 _amt) public"
    ],
    address : "0x3B54797E3E34461C1d3C7A56631c0ffa2E02b4aB"
  },
  NFT : {
    abi : [
      "function setApprovalForAll(address to, bool approved) public",
      "function isApprovedForAll(address owner, address operator) public view returns (bool)",
      "function tokensOfOwner(address owner) external view returns (uint256[])",
    ],
    address : [
      "0xc6b43dfbe2acb52ee930f13a1a36e0f871f0320b"
      "0x3496f8F96c230E6f03eECe73521cAe0C81879700"
    ]
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

//handle the contracts - connect with the signer / provider 
let whoSends = signer ? signer : provider
let outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,whoSends)
let cpxRegistry = new ethers.Contract(CPXContracts.CPXRegistry.address,CPXContracts.CPXRegistry.abi,whoSends)
let cpxNFT = Array.from(new Array(1), (x,i) => {
  return new ethers.Contract(CPXContracts.NFT.address[i],CPXContracts.NFT.abi,whoSends)
})
let cpxTokens = Array.from(new Array(7), (x,i) => {
  return new ethers.Contract(CPXContracts.CPX.address[i],CPXContracts.CPX.abi,whoSends)
})

let planets = []
let UIMain = null

//Check number of planets 
//Starts with a set region 
const regions = [
  {
    range: [1,32],
  }
]
//cross reference tokens 
const tokenToPlane = new Map()
const planeToToken = new Map()

const ethCheck = () => {
  //set data for later
  provider.getBlock ( "latest" ).then(b => { block = b })
    .catch(console.log)
  
  if (typeof web3 !== 'undefined') {
    signer = provider.getSigner()
  }

  //scan for CPX
  if(UIMain && signer) {
    let address = UIMain.address
    //get data from tap 
    if(UIMain.pid > -1) {
      outlandsPlanes.nextTapTime(planeHash(UIMain.pid, UIMain.sid)).then(t => UIMain.nextTap = t.toNumber())
    }

    signer.getAddress().then(a => {
      if(a != UIMain.address) {
        UIMain.address = a  
        //redo contracts 
        outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,signer)
        cpxRegistry = new ethers.Contract(CPXContracts.CPXRegistry.address,CPXContracts.CPXRegistry.abi,signer)
        cpxNFT = Array.from(new Array(1), (x,i) => {
          return new ethers.Contract(CPXContracts.NFT.address[i],CPXContracts.NFT.abi,signer)
        })
        cpxTokens = Array.from(new Array(7), (x,i) => {
          return new ethers.Contract(CPXContracts.CPX.address[i],CPXContracts.CPX.abi,signer)
        })
      }
    }) 
    signer.getBalance().then(b => {
      UIMain.balance = ethers.utils.formatEther(b).slice(0,5)
    })

    if(address !="") {
      cpxRegistry.getCPX(address).then(T => UIMain.CPX = T.map(v => ethers.utils.formatEther(v).slice(0,4)))
      cpxNFT[0].tokensOfOwner(address).then(T => {
        //log of Token ids 
        UIMain.owns = T.map(ti => ti.toNumber())
      })

      //cost 
      outlandsPlanes.costToSearch().then(c => UIMain.searchCost = ethers.utils.formatEther(c))
      //time 
      outlandsPlanes.nextSearchTime(address).then(t => UIMain.nextSearch = t.toNumber())

      //check approval 
      cpxTokens.forEach((T,i) => {
        //check for operator permission 
        T.isOperatorFor(CPXContracts.CPXRegistry.address, address).then(isOp => {
          Vue.set(UIMain.allowance.combiner,i,isOp)
        })
      })
      cpxNFT.forEach((T,i) => {
        //check for operator permission 
        T.isApprovedForAll(address, CPXContracts.CPXRegistry.address).then(isOp => {
          Vue.set(UIMain.allowance.NFT,i,isOp)
        })
      })  
    }
  }  

  //get range of tokens 
  outlandsPlanes.tokenRange().then(r => {
    let start = r[0].toNumber()
    let current = r[1].toNumber()
    let n = 1 + current - start
    //filter tids not stored
    let tids = d3.range(n).map(i => i+start).filter(i => !tokenToPlane.has(i))
    //now pull data 
    tids.forEach(i => {
      outlandsPlanes.tokenToPlane(i).then(p => {
        p = p.map(pi => pi.toNumber())
        //set in map 
        tokenToPlane.set(i, p)
        planeToToken.set(planeHash(...p), i)
      })
    })
  })

  let R = UIMain ? regions[UIMain.rid] : regions[0]
  if(R.range) {
    //reset the planes 
    let n = 1 + R.range[1] - R.range[0] 
    R.pids = d3.range(n).map(i => R.range[0]+i)
    if(!R.shards) R.shards = d3.range(n).map(_=> 0)
    if(!R.max) R.max = maxShards(R.pids)
    //find the number of planes found 
    outlandsPlanes.shardArray(R.pids).then(ns => {
      R.shards = d3.range(n).map(j=> ns[j].toNumber())
    })
  }
}


/* Drawing Functions 

*/
const circlePack = () => {
  let rid = UIMain ? UIMain.rid : 0
  let RNG = new Chance(seed+"."+rid)
  let R = regions[rid]

  let n = 1 + R.range[1] - R.range[0]
  //combine planes - 0 is always there 
  let planes = [] 
  for(let i = 0; i < n; i++) {
    let pi = R.range[0]+i
    let ns = R.shards[i]
    for(let j = 0; j<=ns; j++) planes.push([pi,j])
  }
  let h = d3.hierarchy({
    //once for each plane 
    "children" : planes.map(p => {
      return {
        id : p,
        hash: planeHash(...p),
        token: p[1] > 0 ? planeToToken.get(planeHash(...p)) : -1,
        children : planeCPX(...p).map(cpx => {
          return {
            color : ["red","orange","yellow","green","blue","purple"][cpx[0]-1], 
            A : cpx[1]/10
          }
        })
      }
    })
  })
  h.sum(d => d.A)

  let pack = d3.pack().size([1,1])(h)
  //first is always full circle 
  let map = h.descendants()
  //now shuffle
  return RNG.shuffle(map)
}

let planetMap = []
const drawCircleMap = ()=>{
    const fC = 2*Math.PI
    let iW = window.innerWidth
    let iH = window.innerHeight
    let D = iH < iW ? iH : iW
    //set size
    let canvas = d3.select("#map canvas").attr("height", D).attr("width", D)
    var ctx = canvas.node().getContext("2d")
    ctx.clearRect(0, 0, iW, iH)

    //add data
    let data = circlePack()

    //use canvas because there could be a lot of circles  
    //do layer 1 then layer 2
    planetMap = []
    let selected = null
    let owned = []
    data.filter(d => d.depth == 1).forEach(d => {
      planetMap.push(d)
      //outline in blue
      if(UIMain && (planeHash(UIMain.pid, UIMain.sid) == d.data.hash)){
        selected = d 
      }
      //get owned 
      if(UIMain && UIMain.owns.includes(d.data.token)) {
        owned.push(d)
      }
      ctx.beginPath()
      ctx.arc(D * d.x, D * d.y,D * d.r,0,fC)
      ctx.stroke()      
    })
    data.filter(d => d.depth == 2).forEach(d => {
      ctx.beginPath()
      ctx.arc(D * d.x, D * d.y,D * d.r,0,fC)
      ctx.fillStyle = d.data.color
      ctx.fill()
      ctx.stroke()
    })
    //display owned 
    owned.forEach(d => {
      ctx.beginPath()
      ctx.arc(D * d.x, D * d.y,D * d.r,0,fC)
      ctx.strokeStyle = "green";
      ctx.lineWidth = 5;
      ctx.stroke()
    })
    if(selected) {
      let d = selected
      ctx.beginPath()
      ctx.arc(D * d.x, D * d.y,D * d.r * 1.1,0,fC)
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 5;
      ctx.stroke()
    }
    
    //reset 
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;


    canvas.on("click",function(){
      let p = d3.mouse(this)
      //adjust for scaling 
      let x = (p[0] / D)
      let y = p[1] / D
      //scan shards or planets 
      //get the planet 
      let cp = planetMap.find(_p => {
        let dx = _p.x - x
        let dy = _p.y - y 
        return dx*dx+dy*dy < _p.r*_p.r 
      })  
      
      UIMain.pid = cp.data.id[0] 
      UIMain.sid = cp.data.id[1] 
      //set planet 
      ethCheck()
      drawCircleMap()
    })
}

/* UI 

*/

//creates the VUE js instance
UIMain = new Vue({
    el: '#ui-main',
    data: {
        address: "",
        balance: 0,
        allowance : {
          combiner : [false,false,false,false,false,false,false],
          NFT : [false],
        },
        cpxNames : ["Diamond","Ruby","Citrine","Topaz","Emerald","Sapphire","Amethyst"],
        nftNames : ["Planes Register"],
        CPX : [0,0,0,0,0,0,0],
        owns : [],
        toCombine: 0,
        toMint: 0,
        cap: 32,
        now : 0,
        searchCost : 0.001,
        nextSearch: 0,
        nextTap: 0,
        rid : 0,
        pid : -1,
        sid : -1,
        maySearch: false,
        paid : false,
        madeSearch: false,
        canTap : false,
    },
    mounted() {
      //Poll the number of planets 
      setInterval(()=>{
        ethCheck()
      },5000)
      setInterval(()=> this.now = Date.now()/1000,500)

      //inital push
      ethCheck()   
      drawCircleMap()
    },
    computed: {
        nextSearchTime() {
          let dt = Math.ceil(this.nextSearch - this.now)
          return dt < 0 ? 0 : dt
        },
        nextTapTime() {
          let dt = Math.ceil(this.nextTap - this.now)
          return dt < 0 ? 0 : dt
        },
        maxCPX () {
          return this.CPX.slice(1).reduce((min,val)=>{
            return val < min ? val : min
          },99999)
        },
        unlocked () {
          return this.allowance.combiner.slice(1).reduce((isApproved,ca)=> {
            return isApproved && ca 
          },true)
        }
    },
    methods: {
        conductSearch() {
          //find a planet with shards left 
          let R = regions[this.rid]
          let pids = R.pids.reduce((remain,pi,i)=> {
            if(R.max[i] > R.shards[i]) remain.push(pi)
            return remain
          },[])
          let pi = chance.pickone(pids)
          //pay for search 
          let pay = {
            value: ethers.utils.parseUnits(this.searchCost,'ether'),
          }
          outlandsPlanes.search(pi, pay).then(t => {
            console.log("Transaction sent: "+t.hash)
          })
        },
        tap(){
          outlandsPlanes.Tap(Number(this.pid), Number(this.sid)).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        unlockCombiner(i) {
          cpxTokens[i].authorizeOperator(CPXContracts.CPXRegistry.address).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        unlockNFT(i) {
          cpxNFT[i].setApprovalForAll(CPXContracts.CPXRegistry.address, true).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        combineCPX() {
          let val = ethers.utils.parseUnits(this.toCombine,'ether')
          cpxRegistry.makeDiamond(val.toString()).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
    }
})

//check for resize
window.addEventListener("resize", ()=> {
  drawCircleMap()
})



setInterval(()=>{
    drawCircleMap()
},15000)
