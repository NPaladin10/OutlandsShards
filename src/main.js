//chance
import "../lib/chance.min.js"
//localforage 
import "../lib/localforage.1.7.1.min.js";
//Save db for Indexed DB - localforage
const DB = localforage.createInstance({
  name: "Shards",
  storeName: "ShardsOfTheOutlands"
})
//eth
import {ETHManager} from "./eth/index.js"
//UI 
import {UI} from "./UI.js"
//inventorry 
import {InventoryManager} from "./inventory.js"

//core params
const params = {
  //Seed for generation
  seed: "Compendium2020",
}

//generic application 
const app = {
  DB,
  UI: {},
  params,
  get day() {
    let now = Date.now() / 1000
    return Math.round(now / (24 * 60 * 60))
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
  // ----------- INIT ------------------------------ //
  init() {
    localStorage.setItem("lastPlayer", chance.hash())
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
app.ETH = new ETHManager(app)

//setInterval(()=>app.save(), 5000)


//new player
let lp = localStorage.getItem("lastPlayer")
if(!lp) app.init()
else {
  //load data 
  app.load()
}
