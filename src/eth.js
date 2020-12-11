import*as CONTRACTS from "./abi/index.js"
//ethers js 
import {ethers} from "../lib/ethers-5.0.min.js"
//outlands data 
import*as OutlandsCore from "./outlands.js"
//UI
import {UI} from "./uiETHAdmin.js"

const Regions = {}
const Shards = {}

//Contracts
const Contracts = {}
//deployed addresses 
const ContractAddresses = {
  "goerli": {
    "OutlandsShards": "0x7E4957eF381ce2744F8B9d3EAd2B74889143CbBF",
    "MoveTime": "0xEd094d3eA4d6509D7DBbAaD616F0EbD6b744c17E",
    "CPXToken1155": "0x753606cde5dd3EdD7995d9080020D5281a8C4956",
    "CPXToken20": "0x1897A9F9bbE164B257A394f2C65ad0BE348c33Aa",
    "Gatekeeper" : "0xF988ea224f4Dd6F73d4857D32C1F43375E7b15c4",
    "Storefront1155": "0x6781b3215492B87fd90669719595E8bc3d0eE20A",
    "CPXSimpleMinter": "0x0fF715B78e0d6c92B09286bD2d3Ffa75F77b3E94",
    "DiamondMinter": "0x596E1E05161f994c92b356582E12Ef0fD2A86170",
    "CharacterLocation" : "0x6Ca442A4F8bAEfAc47e9710641b7F4d6B65Ee8c3",
    "Cooldown" : "0x1F8fEC5Cbf415ad6101Dd40326aAa2076964EE33",
    "TreasureMinter" : "0x47033640766f9fe1Dac22a8EBB9595b3e764B73a",
    "DailyTreasure" : "0x7BE9E681D3733F583e827B19942259Cafa7370CA"
  }
}

const Roles = {
  "admin": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "minter": "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  "region_admin": "0xb0c6d6c98634bf90c5127f65c948b52cc8ad5f3b499bdb4170d0b685e60ee0df",
  "burner" : "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848"
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

//Polling
const poll = (UI)=>{
  return new Promise((res,rej)=>{
    let OS = Contracts.OutlandsShards

    const pollRegions = (rids)=>{
      let done = []

      //loop through region ids 
      rids.forEach(id=>{
        OS.getRegion(id).then(region=>{
          let realm = region.realm.toNumber()
          //set region data 
          Regions[id] = {
            id,
            name: OutlandsCore.REGIONS[id - 1].name,
            realm,
            realmName: OutlandsCore.REALMS[realm - 1],
            anchors: region.anchors.slice(),
            get shards() {
              return Object.values(Shards).filter(s=>s.region == this.id)
            }
          }

          //track what is done
          done.push(id)
          if (done.length == rids.length) {
            //set 
            UI.regions = Regions

            res({
              Shards,
              Regions
            })
          }
        }
        )
      }
      )
    }

    //first get the shards 
    OS.count().then(nS=>{
      let pages = Array.from({
        length: 1 + Math.floor(nS.toNumber() / 50)
      }, (v,i)=>i)
      let done = []
      //pull data on the shards 
      pages.forEach(p=>{
        OS.getShardByPage(p).then(data=>{
          let start = 1 + (p * 50)
          //loop and set data
          data.seeds.forEach((seed,i)=>{
            let anchor = data.anchors[i]
            let risk = OutlandsCore.ANCHORRISK[anchor - 1]

            Shards[start + i] = {
              id: start + i,
              seed : seed.slice(2,7)+'...'+seed.slice(-4),
              _seed : seed,
              anchor: {
                id: anchor,
                rarity: getRarity(seed, 1),
                text: OutlandsCore.ANCHORS[anchor - 1],
                risk: [risk, OutlandsCore.RISK[risk]]
              },
              region: data.rids[i].toNumber()
            }
          }
          )

          //track what is done 
          done.push(p)
          if (pages.length = done.length) {
            //reduce regions to unique values
            let rids = [...new Set(Object.values(Shards).map(s=>s.region))]
            //get region info
            pollRegions(rids)
          }
        }
        )
      }
      )
    }
    )
  }
  )
}

//provider & signer 
let provider, signer;

//load contracts 
const loadContracts = (netName)=>{
  for (let x in CONTRACTS) {
    Contracts[x] = new ethers.Contract(ContractAddresses[netName][x],CONTRACTS[x],signer)
    //log 
    console.log("Contract " + x + " loaded.")
  }
}

const goerli = ethers.getDefaultProvider("goerli")

class ETHManager {
  constructor(app) {
    this.app = app
    this.address = ""
    this.net = ""

    this._tokens = {}
    this._explorers = {}

    this.utils = ethers.utils

    //cosmic claim 
    this.claimTime = 22 * 60 * 60

    //initiate UI
    UI(app)

    window.ethereum.enable().then(()=>{
      provider = new ethers.providers.Web3Provider(window.ethereum)
      signer = provider.getSigner()

      provider.getNetwork().then(net=>{
        this.net = app.UI.main.net = net.name

        //check for network contracts
        if (ContractAddresses[net.name]) {
          loadContracts(net.name, signer)

          this.poll(app.UI.main)

          this.getAddress(app.UI.main)
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
  setToken (id, neg, amt) {
    if(!this._tokens[id]) {
      this._tokens[id] = ethers.BigNumber.from(0)
    }

    if(neg == -1) {
      this._tokens[id] = this._tokens[id].sub(amt)
    }
    else {
      this._tokens[id] = this._tokens[id].add(amt)
    }
  }
  get tokens () {
    let aI = this.app.inventory, tInfo = aI.tokens;
    //set unique tokens to empty arrays  
    let _t = {}, uTokens = {};
    aI.uniqeIds.forEach(id => {
      uTokens[id] = {
        name : tInfo[id].name,
        ids: []
      }
    })

    //loop through tokes 
    Object.entries(this._tokens).forEach(t => {
      let id = t[0],
        _u = aI.getUnique(id);
      
      if(_u) {
        uTokens[_u[0]].ids.push(id)
      }
      else {
        _t[id] = {
          name : tInfo[id].name,
          val : Number(ethers.utils.formatUnits(t[1], tInfo[id].units))
        } 
      }  
    })
    
    return Object.assign(_t, uTokens) 
  }
  get contracts() {
    return Contracts
  }
  get shards() {
    return Shards
  }
  get shardArray () {
    return Object.entries(Shards).map(s => {
      let id = s[0],
        data = s[1];
      
      return Object.assign({
        id, 
        text : Regions[data.region].name + ", " + data.seed
      },data)
    })
  }
  get regions() {
    return Regions
  }
  travelTime (from, to) {
    let times = [22,8,2]
    let fromRegion = Shards[from].region,
      toRegion = Shards[to].region,
      fromRealm = Regions[fromRegion].realm,
      toRealm = Regions[toRegion].realm; 
    
    let time = times[0]
    if(fromRegion == toRegion) time = times[2]
    else if (fromRealm == toRealm) time = times[1]
    
    return time
  }
  get explorers () {
    return this._explorers
  }
  approveGatekeeper() {
    return this.submit("CPXToken1155", "setApprovalForAll", [ContractAddresses[this.net].Gatekeeper, true])
  }
  approveStaking() {
    //approve(spender, ammount)
    //1000000 ether 
    let amt = "1000000000000000000000000"
    return this.submit("CPXToken20", "increaseAllowance", [ContractAddresses[this.net].DiamondMinter, amt])
  }
  submit(_contract, _method, data) {
    let method = Contracts[_contract][_method]
    
    return new Promise((res,rej) => {
      method(...data).then(tx=>{
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
  getAddress(UI) {
    if (!provider)
      return

    signer.getAddress().then(address=>{
      //do something on change 
      if (address != this.address) {
        //update address
        this.address = UI.address = address
        //clear admin 
        UI.isAdmin = []

        //check for cosmic claim
        Contracts.CPXSimpleMinter.last_mint(this.address).then(time=>{
          UI.lastCPXClaim = time.toNumber()
        }
        )

        this.poll()
      }

      this.pollBalances(address)
      this.pollAdmin(address)
      this.pollAllowance(address)
      this.pollExplorers()

    }
    )
  }
  async pollExplorer(id) {
    let shard = await Contracts.CharacterLocation.shardLocation(id),
      _shard = shard.toString(),
      sd = Shards[shard],
      rd = Regions[sd.region];

    let cool = await Contracts.Cooldown.cooldown(id),
      _cool = cool.toNumber();
       
    let e = this._explorers[id] = {
      _shard,
      shard : rd.name + ", " + sd.seed,
      _cool
    }
    
    //set UI 
    Vue.set(this.app.UI.main.explorers, id, e)
  }
  async pollExplorers () {
    let UI = this.app.UI.main,
      ids = this.tokens[1000000].ids || [],
      E = this._explorers = {};

    ids.forEach(id => this.pollExplorer(id))
  }
  pollBalances () {
    let app = this.app
      , UI = app.UI.main;

    //get balances
    Contracts.CPXToken20.balanceOf(this.address).then(bal=>Vue.set(UI.tokens, 0, ethers.utils.formatUnits(bal, "ether")))
    
    if(UI.show == "inventory"){
      Contracts.DiamondMinter.getDeposit().then(deposit => {
        Contracts.DiamondMinter.getMintAmount().then(_amt => {
          let val = ethers.utils.formatUnits(deposit.value, "ether")
          let amt = ethers.utils.formatUnits(_amt, "ether")
          UI.staked = [Number(val),Number(amt)]
        })
      }) 
    }
  }
  pollAdmin() {
    let app = this.app
      , UI = app.UI.main;

    //check for admin 
    Object.entries(Contracts).forEach(e=>{
      let name = e[0]
        , C = e[1];

      if (C.hasRole) {
        //check role 
        C.hasRole(Roles.admin, this.address).then(_isAdm=>{
          //push the contract to the list 
          if (_isAdm && !UI.isAdmin.includes(name))
            UI.isAdmin.push(name)
        }
        )
      }
    }
    )
  }
  pollAllowance(address) {
    let app = this.app
      , UI = app.UI.main;

    let approval = {
      "Gatekeeper": ContractAddresses[this.net].Gatekeeper
    }
    let allowance = {
      "DiamondMinter": ContractAddresses[this.net].DiamondMinter
    }

    //check for approval
    Object.entries(approval).forEach(e=>{
      Contracts.CPXToken1155.isApprovedForAll(address, e[1]).then(approved=>{
        if (approved && !UI.approval.includes(e[0])) {
          UI.approval.push(e[0])
        }
      }
      )
    }
    )

    //check for allowance
    Object.entries(allowance).forEach(e=>{
      Contracts.CPXToken20.allowance(address, e[1]).then(allowance=>{
        Vue.set(UI.allowance, e[0], Number(ethers.utils.formatUnits(allowance, "ether")))
      }
      )
    }
    )
  }
  poll() {
    if (!ContractAddresses[this.net]) return

    let app = this.app
      , UI = app.UI.main;
    //poll for shards
    poll(UI)
    //poll for allowance
    if(this.address != "") this.pollAllowance(this.address)

    //tokens 
    let T1155 = Contracts.CPXToken1155
    //TransferSingle(operator, from, to, id, value)
    //TransferBatch(operator, from, to, ids, values)
    if(this.address != ""){
      this._tokens = {}
      //filter for tokens 
      T1155.queryFilter("TransferSingle").then(res => {
        res.forEach(r => {
          //token info in the args 
          let _args = r.args
          if(_args.to == this.address){
            //to address - add token 
            this.setToken(_args.id.toString(), 1, _args.value)
          }
          if(r.args.from == this.address) {
            //from address subtract token 
            this.setToken(_args.id.toString(), -1, _args.value)
          }
        })

        //now set tokens 
        Object.entries(this.tokens).forEach(t => {
          Vue.set(UI.tokens, t[0], t[1])
        })
      })
      //filter for tokens 
      T1155.queryFilter("TransferBatch").then(res => {
        res.forEach(r => {
          //token info in the args 
          let _args = r.args
          if(_args.to == this.address){
            //to address - add token 
            _args.ids.forEach((id,i) => {
              this.setToken(id.toString(), 1, _args[4][i])
            })
          }
          if(r.args.from == this.address) {
            //from address subtract token 
            _args.ids.forEach((id,i) => {
              this.setToken(id.toString(), -1, _args[4][i])
            })
          }
        })

        //now set tokens 
        Object.entries(this.tokens).forEach(t => {
          Vue.set(UI.tokens, t[0], t[1])
        })
      })  
    }
  }
}

export {ETHManager}
//log blocks
/*
goerli.on("block", (blockNumber) => {
    console.log("goerli: "+blockNumber)
})
*/
