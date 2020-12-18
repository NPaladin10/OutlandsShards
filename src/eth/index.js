//ethers js 
import {ethers} from "../../lib/ethers-5.0.min.js"
//ABI 
import*as CONTRACTS from "./abi/index.js"
//UI
import {UI} from "./uiAdmin.js"
//polling functions
import {poll as shardPoll} from "./shards.js"
import {poll as tokenPoll} from "./tokens.js"
import {poll as addressPoll} from "./address.js"
import {poll as explorerPoll} from "./explorers.js"

const goerli = ethers.getDefaultProvider("goerli")

// ether 1000000000000000000

//Contracts
const Contracts = {}
//deployed addresses 
const ContractAddresses = {
  "goerli": {
    "OutlandsRegions": "0xd6fDb4Ed121c0F081F873E33Ced4752BE0379AC6",
    "OutlandsShards": "0x34109B71fb01046B514aBf23733e44439071c247",
    "CPXToken1155": "0x753606cde5dd3EdD7995d9080020D5281a8C4956",
    "CPXToken20": "0x1897A9F9bbE164B257A394f2C65ad0BE348c33Aa",
    "Gatekeeper" : "0xF988ea224f4Dd6F73d4857D32C1F43375E7b15c4",
    "Storefront1155": "0x6781b3215492B87fd90669719595E8bc3d0eE20A",
    "CPXSimpleMinter": "0x0fF715B78e0d6c92B09286bD2d3Ffa75F77b3E94",
    "DiamondMinter": "0x596E1E05161f994c92b356582E12Ef0fD2A86170",
    "CharacterLocation" : "0xf9b9c3b712334AA91CeAa47bC37202Bb863FddEe",
    "Cooldown" : "0x1F8fEC5Cbf415ad6101Dd40326aAa2076964EE33",
    "TreasureMinter" : "0x47033640766f9fe1Dac22a8EBB9595b3e764B73a",
    "DailyTreasure" : "0x7BE9E681D3733F583e827B19942259Cafa7370CA"
  }
}

const Roles = {
  "admin": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "minter": "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  "region_admin": "0xb0c6d6c98634bf90c5127f65c948b52cc8ad5f3b499bdb4170d0b685e60ee0df",
  "burner" : "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848",
  "setter" : "0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda"
}

//Rarity calculations 
const Rarity = {
  "1": {
    "what": "Anchor Rarity",
    "max": 1024,
    "start": 0,
    "stop": 2,
    "steps": [410, 717, 922, 1023]
  }
}
const getRarity = (seed,what)=>{
  let R = Rarity[what]
  let slice = seed.slice(2).slice(R.start, R.stop * 2)
  let reduced = parseInt(slice, 16) % R.max
  let value = R.steps.length + 1

  for (let i = 0; i < R.steps.length; i++) {
    if (reduced < R.steps[i]) {
      value = i + 1
      break
    }
  }

  return value
}

//load contracts 
const loadContracts = (netName, signer)=>{
  for (let x in CONTRACTS) {
    Contracts[x] = new ethers.Contract(ContractAddresses[netName][x],CONTRACTS[x],signer)
    //log 
    console.log("Contract " + x + " loaded.")
  }
}

// encoding function 
const keccak256 = (types, data) => {
  let abiBytes = ethers.utils.defaultAbiCoder.encode(types, data)
  return ethers.utils.keccak256(abiBytes)
}

class ETHManager {
  constructor(app) {
    this.app = app

    //core ethereum data 
    this.provider = null
    this.signer = null
    this.address = ""
    this.net = ""

    //add utility reference 
    this.utils = ethers.utils
    this.BN = ethers.BigNumber
    this.keccak256 = keccak256
    this.rarity = Rarity

    //regions shards
    this._regions = {}
    this._shards = {}

    //tokens 
    this._tokens = {}
    this._explorers = {}

    //handle polling 
    this._tick = 0
    this.pollAddress = addressPoll(this)
    this.pollShards = shardPoll(this)
    this.pollTokens = tokenPoll(this)
    this.pollExplorers = explorerPoll(this)

    //initiate UI
    UI(app)

    window.ethereum.enable().then(()=>{
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      this.signer = this.provider.getSigner()

      this.provider.getNetwork().then(net=>{
        this.net = app.UI.main.net = net.name

        //check for network contracts
        if (ContractAddresses[net.name]) {
          loadContracts(net.name, this.signer)

          this.poll()

          this.init() 
        }
      }
      )
    }
    )
  }
  get ABI () {
    let abi = {}
    Object.entries(CONTRACTS).forEach(e => {
      abi[e[0]] = JSON.parse(e[1])
    })
    return abi
  }
  get contracts () {
    return Contracts
  }
  get regions () {
    return this._regions
  }
  get shards () {
    return this._shards
  }
  get shardArray () {
    return Object.entries(this._shards).map(s => {
      let id = s[0],
        data = s[1];
      
      return Object.assign({
        id, 
        text : data.regionName + ", " + data.seed
      },data)
    })
  }
  shardBySeed (seed) {
    //return if exists
    return this.shards[seed] ? this.shards[seed] : this.shardFromSeed(seed)
  }
  travelTime (from, to) {
    let regions = this._regions
      , times = [22,8,2];

    let fromShard = this.shardBySeed(from)
      , toShard = this.shardBySeed(to);

    let fromRegion = fromShard.region,
      toRegion = toShard.region,
      fromRealm = regions[fromRegion].realm,
      toRealm = regions[toRegion].realm; 
    
    let time = times[0]
    if(fromRegion == toRegion) time = times[2]
    else if (fromRealm == toRealm) time = times[1]
    
    return time
  }
  get explorers () {
    return this._explorers
  }
  submit(_contract, _method, data, overrides) {
    let method = Contracts[_contract][_method]
    overrides = overrides || {}
    
    return new Promise((res,rej) => {
      method(...data, overrides).then(tx=>{
        //if no hash it is a view function
        if(!tx.hash) {
          return res(tx)
        }

        console.log(_method + " submitted: " + tx.hash)
        //wait 
        tx.wait(1).then(resTx=>{
          console.log(_method + " confirmed: " + resTx.blockNumber)

          //resolve submit 
          res(resTx)
        }
        )
      }
      )
    })
  }
  poll() {
    if (!ContractAddresses[this.net]) return

    ++this._tick
    
    //polling 
    this.pollAddress()
    this.pollShards(Contracts.OutlandsShards)
    if(this.address != "") {
      this.pollTokens(Contracts)
      this.pollExplorers()
    } 
  }
  init () {
    let getNFTId = this.app.inventory.getNFTId
      , T = this.app.UI.main.tokens; 

    //decode an array of bignumber token ids and values 
    const tokenMapping = (ids, vals) => {
      return ids.map((_id, i) => {
        let id = _id.toNumber()
          , NFTId = getNFTId(id)
          , _t = NFTId ? T[NFTId] : T[id]
          , val = Number(this.utils.formatUnits(vals[i], _t.units));

        return {
            id,
            name : _t.name,
            _t,
            val,
            notify : "Recieved " + val + " " + _t.name 
          }
      })
    }

    const transferListener = (op,from,to,ids,amts) => {
      if(to != this.address) return

      //make into arrays if not 
      if(!Array.isArray(ids)) {
        ids = [ids]
        amts = [amts]
      }

      //map to tokens 
      let _tokens = tokenMapping(ids, amts)
      //notify 
      _tokens.forEach(t => this.app.simpleNotify(t.notify))
    } 
    
    this.contracts.CPXToken1155.on("TransferBatch",transferListener)
    this.contracts.CPXToken1155.on("TransferSingle",transferListener)
  }
}

export {ETHManager}

//log blocks
/*
goerli.on("block", (blockNumber) => {
    console.log("goerli: "+blockNumber)
})
*/
