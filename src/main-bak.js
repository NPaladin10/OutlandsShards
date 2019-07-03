//chance
import "../lib/chance.min.js"

/* Utilities 
*/
//common, uncommon, rare, very rare, mythic
const rarity = (n) => {
  if(n <= 128) return 1;
  else if(n <= 206) return 2;
  else if(n <= 251) return 3;
  else if(n <= 254) return 4;
  else return 5;
}
const hashToDecimal = (_hash, _id) => {
  //0x ofset
  let id = _id+1
  return parseInt(_hash.slice(id*2,(id*2)+2),16)
}
const rarityFromHash = (hash, i) => {
  return rarity(hashToDecimal(hash,i))
}
//For Vyper formatting
const uintToBytes = (i) => {
  return ethers.utils.hexZeroPad(ethers.utils.bigNumberify(i).toHexString(),32)
}

/* Hash Functions 
  Used for seeding and random generation  
*/
const seed = "OutlandsPlanes2019"

const peopleGen = (seed, r="c") => {
  let rng = new Chance(seed)

  let gen = {
    animal () {
      let types = {    
        bug: ["termite", "tick", "snail", "slug", "worm", "ant", "centipede", "scorpion", "mosquito", "firefly", "locust", "dragonfly", "moth", "bee", "wasp"],
        land: ["snake", "lizard", "rat", "weasel", "boar", "dog", "fox", "wolf", "cat", "lion", "panther", "deer", "horse", "ox", "rhino", "bear", "gorilla", "ape", "mammoth"],
        air: ["chicken", "duck", "goose", "jay", "parrot", "gull", "pelican", "crane", "raven", "falcon", "eagle", "owl", "condor", "pteranodon"],
        water: ["jellyfish", "clam", "eel", "frog", "fish", "crab", "lobster", "turtle", "alligator", "shark", "squid", "octopus", "whale"]
      }
      let a = rng.pickone(types[rng.weighted(["bug","land","air","water"],[20,40,30,10])])
      return a.charAt(0).toUpperCase() + a.slice(1)
    },
    droid () {
      return rng.pickone(["Humanoid", "Quad", "Insectoid", "Block", "Cylinder", "Sphere"])
    },
    plant () {
      return rng.pickone(["Flower","Grass","Vine","Tree","Fern","Conifer","Algae","Palm","Moss","Mushroom"])
    },
    el () {
      return rng.pickone(["Air","Animal","Darkness","Earth", "Fire","Light","Plants","Water","Storms","Winter"]) 
    },    
    dm () {
      let types = ["Chaos","Creation","Destruction","Healing","Justice","Knowledge",
    "Luck","Might","Nature","Secrecy","Transmutation","Wealth"]
      return rng.pickone(types)
    },
    ppl (r) {
      let what = null
      if(r == "c") {
        let types = [["Human"],["Bugbear","Drow","Dwarf","Elf","Gnoll","Gnome","Goblin",
          "Halfling","Hobgoblin","Human","Kobold","Lizardfolk","Minotaur",
          "Orc","Sahuagin"]]
        what = rng.weighted(types,[20,40])
      }
      else if (r == "u") {
        what = ["Ogre","Aasimar","Centaur","Chuul","Tiefling","Troll"]
      }
      return rng.pickone(what)
    },
    c () {
      let what = rng.weighted(["ppl","animal"],[60,40])
      return this[what]("c")
    },
    u () {
      let what = rng.weighted(["ppl","animal"],[60,40])
      return this[what]("c")
      [[,["Plant","Droid","L'na","c+el"]],[30,70]],
    },
    r () {
      [[["Fire Giant","Frost Giant","Stone Giant","Hill Giant"],["u+el","c+el+dm"]],[40,60]]
    },
    v () {
      ["Cloud Giant","Storm Giant","Brass Dragon","Copper Dragon","Bronze Dragon","White Dragon"]
    },
    m () {
      ["Red Dragon","Blue Dragon","Green Dragon","Black Dragon","Gold Dragon","Silver Dragon","Aboleth"]
    }
  }
  
  let d = data[r]
  //uses weight and then pickone
  let what = ["v","m"].includes(r) ? rng.pickone(d) : rng.pickone(rng.weighted(d[0],d[1]))
  let w = []
  if(what.includes("+")) {
    w = what.split("+")
    d = data[w[0]]
    what = rng.pickone(rng.weighted(d[0],d[1])) 
    //check for uncommon pick of c+el 
    if(what.includes("+")) {
      d = data.c 
      what = rng.pickone(rng.weighted(d[0],d[1])) 
      w.push("dm")
    }
  }
  if(what == "Plant") {
    what = rng.pickone(plants) + " People"
  }
  if(what == "Animal") {
    what = animal() + " People"
  }
  if(what == "Droid") {
    what = rng.pickone(droids) + " Droid"
  }
  if(what == "L'na") {
    what = animal() + "/" + animal() + " L'na"
  }
  if(w.length > 0){
    what += " "+rng.pickone(data.el)
    if(w.length > 2) {
      what += "/"+rng.pickone(data.dm) + " Axial"
    }
    else what += " Genasi";
  }
  return what 
}
const heroData = (i,tid,baseHash) => {
  //unique hash for hero 
  let hash = ethers.utils.solidityKeccak256(['string','uint256','bytes32'], [seed,i,baseHash])
  //pull planet id of plane - heroes are from a plane 
  let pi = tokensPlanes.get(tid).pi
  //pull planet data 
  let p = planetData(pi)
  //first hash deterines rarity
  let r = rarityFromHash(hash, 0)
  //second hash determines people
  let ppl = p.people[rarityFromHash(hash, 1)-1]
  return {
    i, tid, pi, r, ppl
  }   
}

const planetHash = (i) => {
  return ethers.utils.solidityKeccak256(['string','string', 'uint256'], [seed, "planet",i]) 
}
const planetData = (i) => {
  let hash = planetHash(i)
  //people array
  //common, uncommon, rare, very rare, mythic 
  let people = ["c","u","r","v","m"].map((j,k) => peopleGen(hash+"-"+k,j)) 

  return {
    i : i,
    hash : hash,
    type : hashToDecimal(hash,0),
    state : hashToDecimal(hash,1),
    people : people,
    planes : []
  }
}
const planeCPX = (hash) => {
  let cpxMag = [5,5,6,6,7,7,8,9,9,10,11,11,12,13,14,15]
  //number of CPX
  let _cpxI = hashToDecimal(hash,1) % 8
  let nCPX = [1,1,1,1,1,2,2,3][_cpxI]
  //designate array - 6 colors of CPX
  return d3.range(nCPX).map(i => {
    return [1 + hashToDecimal(hash,(i*2)+2) % 6, cpxMag[hashToDecimal(hash,(i*2)+3) % 16]]
  })
}
const planeHash = (i) => {
  if(i < 0) return ""
  //Vyper formatting for hash 
  return ethers.utils.solidityKeccak256(['bytes32', 'bytes32'], [ ethers.utils.id(seed), uintToBytes(i)])
}
const planeData = (i) => {
  let hash = planeHash(i)
  let pi = 0
  if(i < 256){
    pi = 1 + hashToDecimal(hash,0) % 32
  }

  return {
    i : i, 
    pi : pi,
    hash : hash,
    cpx : planeCPX(hash)
  }
}

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

let UIMain = null

//cross reference tokens 
const tokensPlanes = new Map()
const planets = new Map()
//function to add planes and check for planets 
const addPlaneData = (i) => {
  let d = planeData(i)
  //check for planet 
  if(!planets.has(d.pi)) {
    planets.set(d.pi,planetData(d.pi))
  }
  let p = planets.get(d.pi)
  p.planes.push(i)

  tokensPlanes.set(i,d)
}
//initialize 32 
d3.range(32).map(addPlaneData)
console.log(d3.range(32).map(i => planetData(i).people))
//test 
console.log(d3.range(32).map(i=> heroData(i,chance.rpg("1d32")[0]-1,"0x"+chance.hash({length:64}))))

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
  if(UIMain && signer && block) {
    let address = UIMain.address
    //get data from tap 
    if(UIMain.pid > -1) {
      //outlandsPlanes.nextTapTime(planeHash(UIMain.pid, UIMain.sid)).then(t => UIMain.nextTap = t.toNumber())
    }

    signer.getAddress().then(a => {
      if(a != UIMain.address) {
        UIMain.address = a  
        //redo contracts 
        outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,signer)
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

      //cost 
      outlandsPlanes.costToSearch().then(c => UIMain.searchCost = ethers.utils.formatEther(c))
      //time 
      outlandsPlanes.nextSearchTime(address).then(t => UIMain.nextSearch = t.toNumber())
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
      if(UIMain && (planeHash(UIMain.tid) == d.data.hash)){
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
        toCombine: 0,
        toMint: 0,
        cap: 32,
        now : 0,
        searchCost : "0.01",
        nextSearch: 0,
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
          //pay for search 
          let pay = {
            value: ethers.utils.parseUnits(this.searchCost,"ether"),
          }
          
          outlandsPlanes.Search(pay).then(t => {
            console.log("Transaction sent: "+t.hash)
          })
          
        },
        tap(){
          //<button class="btn btn-outline-success btn-sm" type="button" v-if="tid>-1" @click="tap()" :disabled="nextTapTime>0">{{tid}} Tap</button>
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
