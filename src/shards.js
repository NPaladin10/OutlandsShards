//set up worker
let worker = new Worker('src/shardsWorker.js')
//Display of terrain
import {plateMap} from "./terrain.js"
//chance
import "../lib/chance.min.js"
let chance = new Chance()

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

/* Contract Data 

*/
let CPXContracts = {
  OutlandsPlanes : {
    abi : [
      "function tokenToPlane(uint256 ti) public view returns(uint256,uint256)", 
    ],
    address : "0xF4fB24395C346916C27b1E3B3b3FDaC1E2c79664"
  },
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
}
//handle the contracts - connect with the signer / provider 
let whoSends = signer ? signer : provider
let outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,whoSends)


//look for parameters
let params = (new URL(document.location)).searchParams
let tid = Number(params.get('tid')) // token id 
tid = tid || 0 
//get token data 
outlandsPlanes.tokenToPlane(tid).then(p => {
  p = p.map(pi => pi.toNumber())
  let hash = planeHash(...p)

  worker.postMessage({
      f: "generate",
      data : {
        opts : {
          what : "L",
          npts : 8000,
          seed: hash
        }
      }
    });
})

//setup data for current map 
let display = null

//creates the VUE js instance
const UIMain = new Vue({
  el: '#ui-main',
  data: {
  },
  mounted() {},
  computed: {},
  methods: {}
})

const drawPlate = () => {
  //set size
  let svg = d3.select("#map svg").attr("width", 800).attr("height", 800)
  plateMap(svg,display)
}

worker.onmessage = function(e) {
  let d = e.data
  if (d.f === "generate") {
    display = Object.assign({
      get what () { return this.data.opts.what }
    },d)
    //check for which display
    if (display.what === "L") drawPlate();
    //remove spinner
    d3.select("#spinner").attr("class", "lds-dual-ring hidden")
  }
  else if (["saved","load"].includes(d.f)) {
    //load saved data
    //UIMain.activeObjects[d.what] = d.data
  }
}
