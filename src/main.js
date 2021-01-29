//chance
import "../lib/chance.min.js"
//localforage 
import "../lib/localforage.1.7.1.min.js";
//Save db for Indexed DB - localforage
const DB = localforage.createInstance({
  name: "Shards",
  storeName: "state"
})


import {ETHManager} from "../eth/index.js"  // ethereum interaction and functions
import {LocalServer} from "../local/index.js" // mock server
import {PollManager} from "./poll.js" //polling to server 
import {FormatManager} from "./formatting.js" //formatting of object for UI and standard data 
import {UI} from "./UI.js"  //UI 
 import {InventoryManager} from "./inventory.js" //inventory

//core params
const params = {
  dbName : "Shards",
  //Seed for generation
  seed: "OS2021",
  shardPeriodTimes : [4 * 60 * 60, 16 * 60 * 60, 32 * 60 * 60],
  shardsPerPeriod : [12,20,16],
  troublePercent : 50,
  travelTimes : [2*3600, 8*3600, 22*3600], // in seconds
  d8Tod4 : [1, 1, 2, 2, 2, 3, 3, 4],
  version : {
    srd : 1,
    exp : 1,
    adv : 1 
  }
}

//generic application 
const app = {
  DB,
  utils : {
    hexToNumber (hex,start,stop) {
      let slice = hex.slice(2).slice(start * 2, stop * 2)
      return parseInt(slice, 16)
    },
    stats (hash, n) {
      let {hexToNumber} = this
      let _hash = this.hash(hash + "-stats")
      let m = 4, _stats = [], _val;

      //loop 
      for (let i = 0; i < n; i++){
        _val = 0
        for(let j = 0; j < m; j++) {
          _val += (j>1 ? -1 : 1)*(1 + (hexToNumber(_hash, i*m+j, i*m+j+1) % 8))  
        }
        _stats.push(_val) 
      }
      
      return _stats
    }
  },
  UI: {},
  params,
  get now () {
    return Math.floor(Date.now() / 1000)
  },
  get day() {
    let now = Date.now() / 1000
    return Math.round(now / (24 * 60 * 60))
  },
  get player () {
    return this.eth.address || localStorage.getItem("lastPlayer")
  },
  // ----------- LOAD/SAVE -------------------------- //
  reset () {
    //remove storage 
    localStorage.clear()
    //clear data 

    //clear db 
    app.DB.clear().then(res => {
      window.location = ""
    })
  },
  load() {   
  },
  save() {
  },
  // ----------- NOTIFY ------------------------------ //
  notify(text, opts) {
    let {layout="bottomCenter", type="info", timeout=1000} = opts
    new Noty({
      text,
      layout,
      type,
      timeout,
      theme: "relax"
    }).show()
  },
  simpleNotify(text, type="info") {
    this.notify(text, {
      type,
      timeout: 2500
    })
  },
  // -------------- Formatting --------------------- //
  timeFormat (time) {
    let hrs = Math.floor(time/3600)
            , hTxt = hrs > 0 ? hrs+"h " : ""
            , min = Math.floor((time-hrs*3600)/60)
            , mTxt = min > 0 ? min+"m " : ""
            , s = time-hrs*3600-min*60
            , sTxt = s > 0 ? s+"s" : "";

    return hTxt+mTxt+sTxt
  },
  // ----------- INIT ------------------------------ //
  init() {
    //localStorage.setItem("lastPlayer", chance.hash())
  },
  // ----------- dice rolls ------------------------------ //
  roll : {
    dF(b,D) {
      b = b || 0
      D = D || 0
      let roll = chance.rpg("4d3")
      let R = -8, suns = 0, moons = 0;
      roll.forEach(v => {
        R+=v
        if(v == 1) moons++
        else if(v == 3) suns++
      })
      let d = R-D
      let res = d >= 5 ? 3 : d >= 3 ? 2 : d >= 0 ? 1 : d >= -2 ? 0 : -1
      let text = ["Critical Failure","Failure","Success","Strong Success","Overwhelming Success"][res+1]
      return {R,res,text,suns,moons}
    },
    AW (b) {
      b = b || 0
      let R = chance.rpg("2d6",{sum:true}) + b 
      let res = R >= 12 ? 3 : R >= 10 ? 2 : R >= 7 ? 1 : 0
      let text = ["Miss","Weak Hit","Strong Hit","Critical"][res]
      return {R,res,text}
    },
    blades (n) {
      n = n || 0
      let roll = n == 0 ? chance.rpg("2d6") : chance.rpg(n+"d6")
      roll.sort((a, b)=> a - b)  // least to greatest
      let crit = roll.reduce((nc,r)=> nc = r==6 ? nc+1 : nc,0)
      let max = n == 0 ? roll[0] : roll[roll.length-1]
      let res = max < 4 ? -1 : max < 6 ? 0 : 1
      let text = ["Miss","Weak Hit","Strong Hit","Critical"][crit > 1 ? 3 : res+1]
      return {roll,crit,res,text}
    }
  }
}
//initialize 
UI(app)
app.inventory = new InventoryManager(app)
app.eth = new ETHManager(app)
LocalServer(app)
FormatManager(app)
PollManager(app)

setInterval(()=>{
  app.server.poll()
  app.poll()
}, 500)


//new player
let lp = localStorage.getItem("lastPlayer")
if(!lp) app.init()
else {
  //load data 
  app.load()
}
