//chance
import "../lib/chance.min.js"

//Seed for generation
const seed = "OutlandsPlanes2019"
//pull utilitie functions like hash and data generation
import {init as uInit} from "./utilities.js"
const utils = uInit(seed)

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

let UIMain = null

//cross reference tokens 
const tokensPlanes = new Map()
const tokensHeroes = new Map()
const planets = new Map()
//function to add planes and check for planets 
const addPlaneData = (i) => {
  let d = utils.planeData(i)
  //check for planet 
  if(!planets.has(d.pi)) {
    planets.set(d.pi,utils.planetData(d.pi))
  }
  let p = planets.get(d.pi)
  p.planes.push(i)

  tokensPlanes.set(i,d)
}
//initialize 32 
d3.range(32).map(addPlaneData)
//test 
//console.log(d3.range(32).map(i=> utils.heroData(i,chance.rpg("1d32")[0]-1,"0x"+chance.hash({length:64}),tokensPlanes)))

const ethCheck = () => {
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
      pids.forEach(addPlaneData)
    }) 
  }

  //scan for CPX
  if(UIMain && signer) {
    let address = UIMain.address
    //get data from tap 
    if(UIMain.pid > -1) {
      //outlandsPlanes.nextTapTime(planeHash(UIMain.pid, UIMain.sid)).then(t => UIMain.nextTap = t.toNumber())
    }
    //cost 
    outlandsPlanes.costToSearch().then(c => UIMain.searchCost = ethers.utils.formatEther(c))
    outlandsHeroes.costToRecruit().then(c => UIMain.recruitCost = ethers.utils.formatEther(c))

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
        //log of Token ids 
        let owns = T.map(ti => ti.toNumber()).filter(i => !tokensHeroes.has(i))
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


/* Drawing Functions 
*/
const circlePack = () => {
  let RNG = new Chance(seed)

  //get data 
  let planes = [...tokensPlanes.values()]
  let h = d3.hierarchy({
    //once for each plane 
    "children" : planes.map(p => {
      return Object.assign({
        children : p.cpx.map(cpx => {
          return {
            color : ["red","orange","yellow","green","blue","purple"][cpx[0]-1], 
            A : cpx[1]/10
          }
        })
      },p)
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
      if(UIMain && (utils.planeHash(UIMain.tid) == d.data.hash)){
        selected = d 
      }
      //get owned 
      if(UIMain && UIMain.owns.includes(d.data.i)) {
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
      
      UIMain.tid = cp.data.i
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
        //Hero data 
        heroIds : [],
        showHeroes : false,
        hid : -1,
        //
        toCombine: 0,
        toMint: 0,
        cap: 32,
        now : 0,
        shareToClaim : 0,
        searchCost : "0.01",
        recruitCost : "0.003",
        nextSearch: 0,
        nextRecruit: 0,
        nextTap: 0,
        rid : 0,
        tid : -1,
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
        nextRecruitTime() {
          let dt = Math.ceil(this.nextRecruit - this.now)
          return dt < 0 ? 0 : dt
        },
        nextTapTime() {
          let dt = Math.ceil(this.nextTap - this.now)
          return dt < 0 ? 0 : dt
        },
        heroData () {
          return this.hid == -1 ? {} : tokensHeroes.get(this.hid)
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
          //pay for search 
          let pay = {
            value: ethers.utils.parseUnits(this.searchCost,"ether"),
          }
          
          outlandsPlanes.Search(pay).then(t => {
            console.log("Transaction sent: "+t.hash)
          })
        },
        Recruit () {
          let pay = {
            value: ethers.utils.parseUnits(this.recruitCost,"ether")
          }
          outlandsHeroes.Recruit(this.tid, pay).then(t => {
            console.log("Transaction sent: "+t.hash)
          })
        },
        claimHeroFunds() {

        },
        tap(){
          //<button class="btn btn-outline-success btn-sm" type="button" v-if="tid>-1" @click="tap()" :disabled="nextTapTime>0">{{tid}} Tap</button>
          outlandsPlanes.Tap(Number(this.pid), Number(this.sid)).then(t => {
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