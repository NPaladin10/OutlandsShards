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
  //CPX based on hash
  let _hash = planeHash(_planet, _shard)
  //number of CPX
  let _cpxI = hashToDecimal(_hash,0) % 8
  let nCPX = [0,1,1,1,1,2,2,3][_cpxI]
  //if shard number greater than max - only 1 CPX
  if(_shard > maxShards(_planet)) {
    nCPX = 1    
  }
  //designate array - 6 colors of CPX
  return d3.range(nCPX).map(i => {
    return 1 + hashToDecimal(_hash,i+1) % 6
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

var provider = null
if (web3.currentProvider) {
    provider = new ethers.providers.Web3Provider(web3.currentProvider)
} else {
    provider = ethers.getDefaultProvider('ropsten')
}
var signer = provider.getSigner()

let block = null
let network = null

let seed = "OutlandsPlanes2019"
let planets = []

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
      "event FailedSearch (address indexed who, uint256 indexed planet)", 
      "event PlaneFound (address indexed who, uint256 indexed planet, uint256 shard)", 
      "function searchData(address who) view returns (uint256 next, uint256 await, uint256 planet)",
      "function planetCap() view returns (uint256 planetCap)",
      "function payForSearch(uint256 _planet) public payable returns(uint256 await)",
      "function conductSearch() public",
      "function getFinder(uint256 _planet, uint256 _shard) public view returns(address)",
      "function getAllFinders(uint256 _planet) public view returns(address[] memory)"
    ],
    address : "0x1604981a1d3b8672a14fac5ceef827d8a213b1d0"
  },
  PlaneCosmic : {
    abi : [
      "event Tap (address indexed who, uint256 indexed planet, uint256 shard)",
      "function timeBetweenTaps() view returns (uint256 timeBetweenTaps)",
      "function nextTapTime(uint256 _planet, uint8 _shard) view returns (uint256 nextTapTime)",
      "function tap(uint256 _planet, uint8 _shard) public",
    ],
    address : "0x932abb31a71ca4ec10003da346470ca3e66277a8"
  },
  CosmicCombiner : {
    abi : [
      "event Combined (address indexed who, uint256 amount)",
      "function toMint() public view returns(uint256 mint)",
      "function mintCPXD() public",
      "function combine(uint256 _amount) public"
    ],
    address : "0x5a2ca292f3cc7d0360d25a088a5cc5a686ca2cab"
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
let planeCosmic = new ethers.Contract(CPXContracts.PlaneCosmic.address,CPXContracts.PlaneCosmic.abi,signer)
let cosmicCombiner = new ethers.Contract(CPXContracts.CosmicCombiner.address,CPXContracts.CosmicCombiner.abi,signer)
let cpxTokens = Array.from(new Array(7), (x,i) => {
  return new ethers.Contract(CPXContracts.CPX.address[i],CPXContracts.CPX.abi,signer)
})
//Log Updates 
outlandsPlanes.on("PlaneFound",(who,planet,shard,event)=>{
    console.log("PlaneFound: ", event)
})
outlandsPlanes.on("FailedSearch",(who,planet,event)=>{
    console.log("FailedSearch: ", event)
})

//Check number of planets 
const capCheck = () => {
  //set data for later
  provider.getBlock ( "latest" ).then(b => { block = b })

  //scan for CPX
  signer.getAddress().then(address => {
    cpxTokens.forEach((T,i) => {
      //check for operator permission 
      T.isOperatorFor(CPXContracts.CosmicCombiner.address, address).then(isOp => {
        UIMain.allowance.combiner[i] = isOp 
      })
      //get CPX
      T.balanceOf(address).then(b => {
        Vue.set(UIMain.CPX,i,Number(ethers.utils.formatEther(b.toString())))
      })
    })
  })

  //scan if they are ready to mint 
  cosmicCombiner.toMint().then(val => {
    UIMain.toMint = Number(ethers.utils.formatEther(val.toString()))
  })

  outlandsPlanes.planetCap().then(_cap=>{
      let cap = _cap.toNumber()
      UIMain.cap = cap 
      //if cap is bigger than what is created push more planets 
      if(cap > planets.length) {
        let delta = UIMain.cap - planets.length
        pushPlanets(delta)
      }
      //look at each 
      for(let i = 0; i < cap; i++) {
          //find the number of planes found 
          outlandsPlanes.getAllFinders(i).then(f => planets[i].f = f)
      }
  })
}


/* Drawing Functions 

*/
const circlePack = (n) => {
  let RNG = new Chance(seed+"."+n)
  let h = null

  if(n == -1) {
    h = d3.hierarchy({
      //once for each planet 
      "children" : planets.map((p,i) => {
        //shard are children 
        p.children = p.shards.map((s,j) => {
          if (j < 1+p.f.length) {
            s.children = s.CPX.map(c => {
              return {
                color : ["red","orange","yellow","green","blue","purple"][c-1], 
                A : 0.3
              }
            })
            //if no children - no cpx make it gray 
            if(s.children.length == 0) {
              s.children = [{
                A:0.3,
                color: "gray"
              }] 
            }
          }
          else s.children = [{
            A:0.3,
            color: "white"
          }] 

          //now return 
          return s
        })
        //return 
        return p 
      })
    }) 
  }
  else {
    let p = planets[n]
    h = d3.hierarchy({
      //once for each planet 
      "children" : p.shards.map((s,j) => {
          if (j < 1+p.f.length) {
            s.children = s.CPX.map(c => {
              return {
                color : ["red","orange","yellow","green","blue","purple"][c-1], 
                A : 0.3
              }
            })
            //if no children - no cpx make it gray 
            if(s.children.length == 0) {
              s.children = [{
                A:0.3,
                color: "gray"
              }] 
            }
          }
          else s.children = [{
            A:0.3,
            color: "white"
          }] 

          //now return 
          return s
        })
    })
  }
  h.sum(d => d.A)

  let pack = d3.pack().size([1,1])(h)
  //first is always full circle 
  let map = h.descendants().slice(1)
  //now shuffle
  return RNG.shuffle(map)
}

let planetMap = []
const drawCircleMap = (n)=>{
    const fC = 2*Math.PI
    let iW = window.innerWidth
    let iH = window.innerHeight
    let D = iH < iW ? iH : iW
    //set size
    let canvas = d3.select("#map canvas").attr("height", iH).attr("width", iW)
    var ctx = canvas.node().getContext("2d")
    ctx.clearRect(0, 0, iW, iH)

    //add data
    let data = circlePack(n)

    //use canvas because there could be a lot of circles  
    //do layer 1 then layer 2
    planetMap = []
    data.filter(d => d.depth == 1).forEach(d => {
      planetMap.push(d)
      ctx.beginPath()
      ctx.arc(D * d.x + iH/2, D * d.y,D * d.r,0,fC)
      ctx.stroke()
    })
    data.filter(d => d.depth == 2).forEach(d => {
      ctx.beginPath()
      ctx.arc(D * d.x + iH  /2, D * d.y,D * d.r,0,fC)
      if(n>-1){
        ctx.fillStyle = d.data.color
        ctx.fill()
      }
      ctx.stroke()
    })
    data.filter(d => d.depth == 3).forEach(d => {
      ctx.beginPath()
      ctx.arc(D * d.x + iH/2, D * d.y,D * d.r,0,fC)
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
    //get search data from planes 
    outlandsPlanes.searchData(a).then(data => {
      UIMain.nextSearch = data.next.toNumber() 
      //look if search is done 
      if(data.await.toNumber() > 0) {
        //if search submitted - may not search
        if(!UIMain.madeSearch) UIMain.maySearch = true 
      }
      //allows search 
      else {
        UIMain.madeSearch = false
      }
    })    
  })
}

/* UI 

*/

//creates the VUE js instance
const UIMain = new Vue({
    el: '#ui-main',
    data: {
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
        pid : -1,
        sid : -1,
        maySearch: false,
        paid : false,
        madeSearch: false,
        canTap : false,
    },
    mounted() {
      // Start up 
      //inital push
      capCheck()   
      pushPlanets(this.cap)
      //Poll the number of planets 
      setInterval(()=>{
        capCheck()
        searchCheck()
      },5000)
      setInterval(()=> this.now = Date.now()/1000,500)

      this.pid = Date.now()%32
      drawCircleMap(this.pid)
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
        showPayForSearch () {
            drawCircleMap(this.pid)
            //update the view 
            if(this.pid == -1) return 
            if(this.maySearch || this.madeSearch || this.paid) return false
            
            return true
        },
    },
    methods: {
        payForSearch() {
            //pay for search 
            let pay = {
              value: ethers.utils.parseUnits('100','finney')
            }
            outlandsPlanes.payForSearch(this.pid,pay).then(t => {
              console.log("Transaction sent: "+t.hash)
              this.paid = true
            })
        },
        conductSearch() {
          outlandsPlanes.conductSearch().then(t => {
              console.log("Transaction sent: "+t.hash)
              //remove button
              this.maySearch = false
              this.madeSearch = true
              this.paid = false
          })
        },
        tap(){
          planeCosmic.tap(this.pid, this.sid).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        unlockCombiner(i) {
          cpxTokens[i].authorizeOperator(CPXContracts.CosmicCombiner.address).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        combineCPX() {
          let val = ethers.utils.parseUnits(this.toCombine,'ether')
          cosmicCombiner.combine(val.toString()).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        mint() {
          cosmicCombiner.mintCPXD().then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        }
    }
})



setInterval(()=>{
    drawCircleMap(UIMain.pid)
},15000)
