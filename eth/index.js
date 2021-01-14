//ethers js 
import {ethers} from "../lib/ethers-5.0.min.js"
//ABI 
import*as CONTRACTS from "./abi/index.js"
//UI
import {UI} from "./uiAdmin.js"
//polling functions
import {poll as shardPoll} from "./shards.js"
import {poll as tokenPoll} from "./tokens.js"
import {poll as addressPoll} from "./address.js"
import {poll as explorerPoll} from "./explorers.js"

/*
./geth --datadir os-chain --rpc --dev --rpccorsdomain "https://remix.ethereum.org,http://remix.ethereum.org" console
eth.sendTransaction({from:eth.coinbase, to:"0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c", value: web3.toWei(5.0, "ether")})
*/

/*
<!--NET ALERT---------------------------------------------->
      <div class="alert alert-warning mx-2" role="alert" v-if="net != 'goerli'">The app is active on the Goerli network. Please change your network.</div>
      <!--END NET ALERT---------------------------------------------->
*/

const goerli = ethers.getDefaultProvider("goerli")

// ether 1000000000000000000

/*
  TODO
*/

//Contracts
const Contracts = {}
//deployed addresses 
const ContractAddresses = {
  "unknown": {
    "CPXToken20": "0x71F28DF03E4465844ad0eAc2E2DFBFD6A739aAde",
    "CPXSimpleMinter": "0xb72b3C78Bc9176dD78034f12CD858377871C29d5",
    "CPXToken1155": "0x09BE358421D5397D8EA764321fce63472E07dB98",
    "DiamondMinter": "0xd94990E65e17452Bf5de2B90890aA8a5c8E24509",
    "Gatekeeper": "0x257C9B613dE179b22e8639ba23819c7dF716A141",
    "Storefront1155": "0x871b170f80c6b4315382bd821EB7f1aea2b2Df2D",
    "OutlandsRegions": "0xeB4141432F26D9d14743F3AF15cD301Ea8cE5443",
    "OutlandsShards": "0x40F35e140392265b3D1791f6aa5036EFFfE0deE5",
    "TreasureMinter": "0xa5Bb27eA134A5d69621b6e4dBdB1807686BC44E7",
    "DailyTreasure": "0x4ED298E8b9576953810737D2aC0D245FB87d3Dd6",
    "Characters": "0x6cd3C3cDECAc988127DC7431c43dCf8752DE6Ec1",
    "ExploreShard": "0x16665f69a2a543a59FcD069Bcee1caeD7833aB31",
    "Adventurers": "0x104c4755FfA1D5E51be39C35ad500DDB123C0880"
  },
  "goerli": {
    "OutlandsRegions": "0x4141fbe02e62aD6D5ddA658D3a4d30d0C18Aa98e",
    "OutlandsShards": "0xEa6E5c8ABf8a46a85664431BC416C4caFA657C34",
    "CPXToken1155": "0x753606cde5dd3EdD7995d9080020D5281a8C4956",
    "CPXToken20": "0x1897A9F9bbE164B257A394f2C65ad0BE348c33Aa",
    "Gatekeeper": "0xF988ea224f4Dd6F73d4857D32C1F43375E7b15c4",
    "Storefront1155": "0x6781b3215492B87fd90669719595E8bc3d0eE20A",
    "CPXSimpleMinter": "0x0fF715B78e0d6c92B09286bD2d3Ffa75F77b3E94",
    "DiamondMinter": "0x596E1E05161f994c92b356582E12Ef0fD2A86170",
    "CharacterLocation": "0xf9b9c3b712334AA91CeAa47bC37202Bb863FddEe",
    "Cooldown": "0x1F8fEC5Cbf415ad6101Dd40326aAa2076964EE33",
    "TreasureMinter": "0x47033640766f9fe1Dac22a8EBB9595b3e764B73a",
    "DailyTreasure": "0x7BE9E681D3733F583e827B19942259Cafa7370CA"
  }
}

const Roles = {
  "admin": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "minter": "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  "nft_minter": "0x3a5b873628a2c49bf313473942acc8932f6f84c76b74bf3db0e4d8b51277a623",
  "region_admin": "0xb0c6d6c98634bf90c5127f65c948b52cc8ad5f3b499bdb4170d0b685e60ee0df",
  "burner": "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848",
  "setter": "0x61c92169ef077349011ff0b1383c894d86c5f0b41d986366b58a6cf31e93beda",
  "cool": "0x8fa59863e4f05d398724705bbab4245b11d7346bacbefe73f85dac3a46097744",
  "mover": "0xe5ed70e23144309ce456cb48bf5e6d0d8e160f094a6d65ecf1d5b03cf292d8e6"
}

//load contracts 
const loadContracts = (netName,signer)=>{
  for (let x in CONTRACTS) {
    Contracts[x] = new ethers.Contract(ContractAddresses[netName][x],CONTRACTS[x],signer)
    //log 
    console.log("Contract " + x + " loaded.")
  }
}

class ETHManager {
  constructor(app) {
    this.app = app

    //core ethereum data 
    this.provider = null
    this.signer = null
    this.address = null
    this.net = ""

    //add utility reference 
    this.utils = ethers.utils
    app.BN = this.BN = ethers.BigNumber
    this.constants = ethers.constants

    //handle polling 
    this._tick = 0
    this.pollAddress = addressPoll(this)
    this.pollShards = shardPoll(this)
    this.pollTokens = tokenPoll(this)
    this.pollExplorers = explorerPoll(this)

    //initiate UI
    UI(app)

    //add app utility function 
    app.utils.hash = (seed)=>{
      return ethers.utils.id(app.params.seed + seed)
    }
    app.utils.ethId = (text)=>{
      return ethers.utils.id(text)
    }

    if (window.ethereum) {
      window.ethereum.enable().then(()=>{
        this.provider = new ethers.providers.Web3Provider(window.ethereum)
        this.signer = this.provider.getSigner()

        this.getNetwork()
      }
      )
    } else {
      this.provider = ethers.getDefaultProvider()

      //check for key 
      let key = localStorage.getItem("lastPlayer")
      if (key) {
        this.signer = new ethers.Wallet(key)
      } else {
        this.signer = ethers.Wallet.createRandom()
        //save key 
        localStorage.setItem("lastPlayer", this.signer.privateKey)
      }

      console.log("Address: " + this.signer.address)
      this.getNetwork()
    }
  }
  getNetwork() {
    //set address 
    this.address = this.signer.address

    //now get net 
    this.provider.getNetwork().then(net=>{
      this.net = this.app.UI.main.net = net.name

      //check for network contracts
      if (ContractAddresses[net.name]) {
        loadContracts(net.name, this.signer)
      }
    }
    )
  }
  abiBytes(types, data) {
    return ethers.utils.defaultAbiCoder.encode(types, data)
  }
  keccak256(types, data) {
    let bytes = ethers.utils.defaultAbiCoder.encode(types, data)
    return ethers.utils.keccak256(bytes)
  }
  get ABI() {
    let abi = {}
    Object.entries(CONTRACTS).forEach(e=>{
      abi[e[0]] = JSON.parse(e[1])
    }
    )
    return abi
  }
  get contracts() {
    return Contracts
  }
  get tokens() {
    return this.app.UI.main.tokens
  }
  get regions() {
    return this._regions
  }
  get shards() {
    return this._shards
  }
  get shardArray() {
    return Object.entries(this._shards).map(s=>{
      let id = s[0]
        , data = s[1];

      return Object.assign({
        id,
        text: data.regionName + ", " + data.seed
      }, data)
    }
    )
  }
  shardBySeed(seed) {
    //return if exists
    return this.shards[seed] ? this.shards[seed] : this.shardFromSeed(seed)
  }
  travelTime(from, to) {
    let regions = this._regions
      , times = [22, 8, 2];

    let fromShard = this.shardBySeed(from)
      , toShard = this.shardBySeed(to);

    let fromRegion = fromShard.region
      , toRegion = toShard.region
      , fromRealm = regions[fromRegion].realm
      , toRealm = regions[toRegion].realm;

    let time = times[0]
    if (fromRegion == toRegion)
      time = times[2]
    else if (fromRealm == toRealm)
      time = times[1]

    return time
  }
  get explorers() {
    return this._explorers
  }
  submit(_contract, _method, data, overrides) {
    let method = Contracts[_contract][_method]
    overrides = overrides || {}

    return new Promise((res,rej)=>{
      method(...data, overrides).then(tx=>{
        //if no hash it is a view function
        if (!tx.hash) {
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
    }
    )
  }
  poll() {
    return
    this.pollShards(Contracts)

    if (!ContractAddresses[this.net])
      return

    ++this._tick

    //polling 
    this.pollAddress()
    if (this.address != "") {
      this.pollTokens(Contracts)
      this.pollExplorers()
    }
  }
  init() {
    let getNFTId = this.app.inventory.getNFTId
      , T = this.tokens;

    //decode an array of bignumber token ids and values 
    const tokenMapping = (ids,vals)=>{
      return ids.map((_id,i)=>{
        let id = _id.toNumber()
          , NFTId = getNFTId(id)
          , _t = NFTId ? T[NFTId] : T[id]
          , val = Number(this.utils.formatUnits(vals[i], _t.units));

        return {
          id,
          name: _t.name,
          _t,
          val,
          notify: "Recieved " + val + " " + _t.name
        }
      }
      )
    }

    const transferListener = (op,from,to,ids,amts)=>{
      if (to != this.address)
        return

      //make into arrays if not 
      if (!Array.isArray(ids)) {
        ids = [ids]
        amts = [amts]
      }

      //map to tokens 
      let _tokens = tokenMapping(ids, amts)
      //notify 
      _tokens.forEach(t=>this.app.simpleNotify(t.notify))
    }

    const exploreListener = (seed,id,t,cool)=>{
      id = id.toString()
      cool = cool.toNumber()
      //check that they own the explorer 
      if (T[1000000] && T[1000000].ids.includes(id)) {
        let coolText = this.app.timeFormat(cool - this.app.now)
        this.app.simpleNotify(coolText)
      }
    }

    this.contracts.CPXToken1155.on("TransferBatch", transferListener)
    this.contracts.CPXToken1155.on("TransferSingle", transferListener)
    this.contracts.ExploreShard.on("ExploredShard", exploreListener)
  }
}

export {ETHManager}

//log blocks
/*
goerli.on("block", (blockNumber) => {
    console.log("goerli: "+blockNumber)
})
*/
