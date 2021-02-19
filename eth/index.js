// ether 1000000000000000000
/*
./geth --datadir os-chain --rpc --dev --rpccorsdomain "https://remix.ethereum.org,http://remix.ethereum.org" console
eth.sendTransaction({from:eth.coinbase, to:"0x13C5e101b3Dde6063FE68afD3DA18645F6060B2c", value: web3.toWei(5.0, "ether")})
*/

/*
<!--NET ALERT---------------------------------------------->
     <div class="alert alert-warning mx-2" role="alert" v-if="net != 'goerli'">The app is active on the Goerli network. Please change your network.</div>
      <!--END NET ALERT---------------------------------------------->
*/
/*
  TODO
*/


//ethers js 
import {ethers} from "../lib/ethers-5.0.min.js"
//ABI 
import * as CONTRACTS from "./abi/index.js"
//UI
import {UI} from "./uiAdmin.js"
//polling functions
import {poll as addressPoll} from "./address.js"
import {poll as shardsPoll} from "./shards.js"

const goerli = ethers.getDefaultProvider("goerli")

//Contracts
const Contracts = {}
//deployed addresses 
const ContractAddresses = {
  "goerli": {
    "ShardV1" : "0xe9FD8F89c0b96eE174197cA3d29F9Dcc684B991F",
    "CPX1155": "0x26a96fa88E27fA136cd29C325EA84080C0311f38",
    "Gatekeeper": "0x54664cF49fF978D9A1548395b0000BCAA15B13AA",
  }
}

//0x0000000000000000000000000000000000000000

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
  Object.keys(CONTRACTS).forEach(key => {
    Contracts[key] = new ethers.Contract(ContractAddresses[netName][key],CONTRACTS[key],signer)
    //log 
    console.log("Contract " + key + " loaded.")
  })
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

    //add app utility function 
    app.utils.hash = (seed)=>{
      return ethers.utils.id(app.params.seed + seed)
    }
    app.utils.ethId = (text)=>{
      return ethers.utils.id(text)
    }

    //initiate UI
    UI(app, this)

    //handle polling 
    this._tick = 0
    this.pollAddress = addressPoll(app, this)
    this.pollShards = shardsPoll(app, this)

    //load contracts if a provider exists 
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
  async getNetwork() {
    //set address 
    this.address = await this.signer.getAddress()

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
  async submit (_contract, _method, data, overrides) {
    let method = Contracts[_contract][_method]
    overrides = overrides || {}

    let tx = await method(...data, overrides)
    //if no hash it is a view function
    if (!tx.hash) {
      return res(tx)
    }        

    console.log(_method + " submitted: " + tx.hash)
    this.app.simpleNotify("Tx: "+tx.hash)

    //wait 
    let resTx = await tx.wait(1)
    console.log(_method + " confirmed: " + resTx.blockNumber)
    //resolve submit 
    return resTx
  }
  poll() {
    if (!ContractAddresses[this.net])
      return

    ++this._tick

    //polling 
    this.pollAddress()
    this.pollShards()
  }
  init() {

  }
}

export {ETHManager}
