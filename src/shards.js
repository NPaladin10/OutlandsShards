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

const planetHash = (_planet) => {
  return ethers.utils.solidityKeccak256(['string', 'uint256'], [seed, _planet]) 
}
const planeHash = (_planet, _shard) => {
  return ethers.utils.solidityKeccak256(['bytes32', 'uint256'], [planetHash(_planet), _shard]) 
}
const maxShards = (_planet) => {
  let n = hashToDecimal(planetHash(_planet),0)
  return 1 + n % 32
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

//FUnction to push planets to the array 
//Everything calculate from hash 
const pushPlanets = (n) => {
  //start with current length index 
  let start = planets.length
  //iterate over n 
  for(let i = 0; i < n; i++) {
    //get the id and max number of shards 
    let id = start + i
    let ms = maxShards(id)

    //push new planet
    planets.push({
      id : id,
      hash : planetHash(i),
      maxS : ms,
      f: [],
      //32 shards  - determine hash and cpx 
      shards : d3.range(32).map(j=>{
        return {
          id : j,
          hash : planeHash(id, j),
          CPX : planeCPX(id, j)
        }
      })
    })
  }
}


/* Ethers Provider
*/

let provider = null, signer = null, wallet = null;
if (typeof web3 !== 'undefined') {
    provider = new ethers.providers.Web3Provider(web3.currentProvider)
    signer = provider.getSigner()
} else {
    provider = ethers.getDefaultProvider('ropsten')
    //find a signer if stored 
    let lastSigner = localStorage.getItem("lastSigner")
    //if nothing is stored - create wallet and save 
    if(!lastSigner) {
      wallet = ethers.Wallet.createRandom()
      localStorage.setItem(signer.address, wallet.mnemonic)  
      localStorage.setItem("lastSigner",wallet.address)
    }
    else {
      //pull wallet from mnemonic
      let mnemonic = localStorage.getItem(lastSigner)  
      wallet = ethers.Wallet.fromMnemonic(mnemonic)
      signer = wallet.connect(provider)
    }
}

let block = null
let network = null

let seed = "OutlandsPlanes2019"
let planets = []
let UIMain = null

provider.getNetwork().then(n=> { network = n})
//log new blocks 
provider.on('block', (blockNumber)=>{
    console.log(network.name + ' New Block: ' + blockNumber)
})

/* Contract Data 

*/

let CPXContracts = {
  OutlandsPlanes : {
    abi : [
      "event FailedSearch (uint256 indexed region, address indexed who)", 
      "event NewPlane (uint256 indexed planet, uint256 shard, address indexed finder)",
      "function regionData(uint256 ri) public view returns(uint256[33])", 
      "function shardCount(uint256 pi) public view returns(uint256)",
      "function search(uint256 ri) public returns(bool)"
    ],
    address : "0x94616B1E5cadD4A3993ff3Ca5D5815547d5ABbBC"
  },
  CPXRegistry : {
    abi : [
      "function isApproved(address account) external view returns (bool)",
      "function getCPX(address account) external view returns (uint256[7] cpx)",
      "function makeDiamond(uint256 _amt)"
    ],
    address : "0x5BB1a3E7ED4566aE9Ac02372bdD777245A6CcBa5"
  },
  NFT : {
    abi : [
      "function tokensOfOwner(address owner) external view returns (uint256[])",
    ],
    address : [
      "0x72ab0A4eA9E64FcFCC154d55b8777A7ad8383F65"
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
//handle the contracts - connect with the signer  
let outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,signer)
let cpxRegistry = new ethers.Contract(CPXContracts.CPXRegistry.address,CPXContracts.CPXRegistry.abi,signer)
let cpxNFT = Array.from(new Array(1), (x,i) => {
  return new ethers.Contract(CPXContracts.NFT.address[i],CPXContracts.NFT.abi,signer)
})
let cpxTokens = Array.from(new Array(7), (x,i) => {
  return new ethers.Contract(CPXContracts.CPX.address[i],CPXContracts.CPX.abi,signer)
})

//connect wallet if it exists

//Log Updates 
outlandsPlanes.on("NewPlane",(who,planet,shard,event)=>{
    console.log("NewPlane: ", event)
})
outlandsPlanes.on("FailedSearch",(who,planet,event)=>{
    console.log("FailedSearch: ", event)
})

//Check number of planets 
//Starts with a set region 
const regions = [
  {
    range: [1,32],
    shards : []
  }
]
const capCheck = () => {
  //set data for later
  provider.getBlock ( "latest" ).then(b => { block = b })
    .catch(e => {
      console.log(e)
    })

  //scan for CPX
  if(UIMain) signer.getBalance().then(b => {
    UIMain.balance = ethers.utils.formatEther(b)
  }) 
  signer.getAddress().then(address => {
    cpxRegistry.getCPX(address).then(T => UIMain.CPX = T.map(ethers.utils.formatEther))
    cpxNFT[0].tokensOfOwner(address).then(T => {
      //log of Token ids 
    })

    cpxTokens.forEach((T,i) => {
      //check for operator permission 
      T.isOperatorFor(CPXContracts.CPXRegistry.address, address).then(isOp => {
        UIMain.allowance.combiner[i] = isOp 
      })
    })
  })

  let R = UIMain ? regions[UIMain.rid] : regions[0]
  if(R.range) {
    //reset the planes 
    let n = 1 + R.range[1] - R.range[0] 
    if(R.shards.length < n) R.shards = d3.range(n).map(_=> 0)
    for(let i = 0; i < n; i++) {
      //look at each 
      //find the number of planes found 
      let pi = i+R.range[0]
      outlandsPlanes.shardCount(pi).then(ns => {
        R.shards[pi] = ns.toNumber()
      })
    }
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
    let canvas = d3.select("#map canvas").attr("height", iH).attr("width", iW)
    var ctx = canvas.node().getContext("2d")
    ctx.clearRect(0, 0, iW, iH)

    //add data
    let data = circlePack()

    //use canvas because there could be a lot of circles  
    //do layer 1 then layer 2
    planetMap = []
    data.filter(d => d.depth == 1).forEach(d => {
      planetMap.push(d)
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

    canvas.on("click",function(){
      let p = d3.mouse(this)
      //adjust for scaling 
      let x = (p[0]-iH/2) / D
      let y = p[1] / D
      //set planet 
      searchCheck()
      //scan shards or planets 
      //get the planet 
      let cp = planetMap.find(_p => {
        let dx = _p.x - x
        let dy = _p.y - y 
        return dx*dx+dy*dy < _p.r*_p.r 
      })  
      if(UIMain.pid > -1) {
        UIMain.sid = cp.data.id 
        //check if claimed 
        UIMain.canTap = UIMain.sid < 1+planets[UIMain.pid].f.length ? true : false
      }
      else {
        UIMain.pid = cp.data.id
        UIMain.sid = -1
      }
    })
}

const searchCheck = () => {
  signer.getAddress().then(a => {
    //get data from tap 
    if(UIMain.sid > -1) {
      planeCosmic.nextTapTime(UIMain.pid, UIMain.sid).then(t => UIMain.nextTap = t.toNumber())
    }    
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
          combiner : [false,false,false,false,false,false,false]
        },
        cpxNames : ["Ruby","Citrine","Topaz","Emerald","Sapphire","Amethyst"],
        CPX : [0,0,0,0,0,0,0],
        toCombine: 0,
        toMint: 0,
        cap: 32,
        now : 0,
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
      // Start up 
      this.address = signer.address
      //Poll the number of planets 
      setInterval(()=>{
        capCheck()
        searchCheck()
      },5000)
      setInterval(()=> this.now = Date.now()/1000,500)

      //inital push
      capCheck()   
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
    },
    methods: {
        conductSearch() {
            //pay for search 
            let pay = {
              value: ethers.utils.parseUnits('100','finney'),
              // The price (in wei) per unit of gas
              gasPrice: ethers.utils.parseUnits('2.0', 'gwei'),
              gasLimit: 100000,
            }
            outlandsPlanes.search(this.rid,pay).then(t => {
              console.log("Transaction sent: "+t.hash)
            })
        },
        tap(){
          planeCosmic.tap(this.pid, this.sid).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        unlockCombiner(i) {
          cpxTokens[i].authorizeOperator(CPXContracts.CPXRegistry.address).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        combineCPX() {
          let val = ethers.utils.parseUnits(this.toCombine,'ether')
          cosmicCombiner.combine(val.toString()).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
    }
})



setInterval(()=>{
    drawCircleMap()
},15000)
