//chance
import "../lib/chance.min.js"
//localforage 
import "../lib/localforage.1.7.1.min.js";
//Save db for Indexed DB - localforage
const DB = localforage.createInstance({ name: "OP", storeName: "OutlandsPlanes" })

//pull utility functions like hash and data generation
import {init as uInit} from "./utilities.js"
//UI 
import {UI} from "./UI.js"
//intialize resolvers
import {resolvers} from "./resolvers.js"

//core params
const params = {
  //Seed for generation
  seed : "OutlandsPlanes2019",
  timeBetween : [2*3600,3600],
  coolPerStress : 60*12,
}
const utils = uInit(params.seed)

//generic application 
const app = {
  DB,
  UI : {},
  params,
  utils, 
  get day () {
    let now = Date.now() / 1000
    return Math.round(now/(24*60*60))
  },
  //local cpx 
  cpx : [0,0,0,0,0,0,0],
  updateCPX (i,val) {
    this.cpx[i] += val 
    //update UI 
    this.UI.main.CPX = this.cpx.slice()
  },
  //specific token data 
  planets : new Map(),
  planes : new Map(),
  heroes : new Map(),
  get heroIds () {
    return [...this.heroes.keys()]
  },
  giveXP (id,xp) {
    let h = this.heroes.get(id).save
    xp += h.xp 
    //update 
    let H = utils.heroData({
      heroId: h.id,
      planeId: h.plane,
      block: h.block,
      xp: xp,
      network : h.network 
    })
    this.heroes.set(H.id,H)
  },
  crew : new Map(),
  //track cooldown independently
  cooldown : {},
  //record challenge results 
  challenges : {},
  //track claims - so they cannot be made again 
  claims : {},
  makeClaim (what,plane,i) {
    let cPre = this.day+"."+what
    let cPost = plane+"."+i 
    if(this.claims[cPre]) {
      this.claims[cPre].push(cPost)
    }
    else this.claims[cPre] = [cPost]
  },
  mayClaim (what,plane,i) {
    let cPre = this.day+"."+what
    if(!this.claims[cPre]) return true
    let cPost = plane+"."+i
    if(!this.claims[cPre].includes(cPost)) return true
    return false 
  },
  //cross reference tokens 
  tokens : new Map(),
  //set local data - called after tokens are updated 
  setLocalData () {
    //[...tokens.get("hero").values()]
  },
  //Load and save 
  _load(address) {
    /*
    let loadList = ["challenges"]
    loadList.forEach(what => {
      DB.getItem(address+"."+what).then(r => {
        if(!r) return
        r.forEach(_r => this[what].set(_r[0],_r[1]))
      })  
    })
    */
    //pull heroes 
    DB.getItem(address+".heroes").then(heroes => {
      if(!heroes) return
      let allF = app.factions.player.map(f => f.id)
      //load heroes
      heroes.forEach(h => {
        let faction = h.faction || chance.pickone(allF)
        faction = faction == -1 ? chance.pickone(allF) : faction
        //check for factions 
        let H = utils.heroData({
          heroId: h.id,
          planeId: h.plane,
          block: h.block,
          xp: h.xp,
          network: h.network,
          name : h.name || "",
          faction : faction
          })
        //set 
        this.heroes.set(H.id,H)
      })
      //set UI.main
      this.UI.main.heroIds = [...this.heroes.keys()]
    })
    //pull heroes 
    DB.getItem(address+".crew").then(crew => {
      if(!crew) return
      //load heroes
      crew.forEach(c => {
        let plane = app.planes.get(c.plane)
        let C = utils.crewData(c.id,plane,c.baseHash,c.network)
        C._name = c.name || ""
        //set 
        this.crew.set(C.id,C)
      })
      //set UI.main
      this.UI.main.crewIds = [...this.crew.keys()]
    })
  },
  load () {
    let address = this.UI.main.address
    //load local data and load address data 
    this._load("")
    //load local cpx 
    DB.getItem("cpx").then(_cpx => {
      if(_cpx) this.cpx = _cpx
    })
    //pull claims data 
    DB.getItem(".claims").then(claims => {
      this.claims = claims || {}
    })
    //pull cooldown data 
    DB.getItem(".cool").then(cool => {
      this.cooldown = cool || {}
    })
    //challenges
    DB.getItem(".challenges").then(c => {
      this.challenges = c || {}
    })
    //faction rep 
    DB.getItem(".rep").then(rep => {
      this.factions._rep = rep || {}
    })
    if(address != "") this._load(address)
  },
  save () {
    if(this.UI.main) {
      //save local cpx 
      DB.setItem("cpx",this.cpx)
      //cooldown
      DB.setItem(".cool",this.cooldown)
      //local claims 
      DB.setItem(".claims",this.claims)
      //challenge data 
      DB.setItem(".challenges",this.challenges)
      //faction rep 
      DB.setItem(".rep",this.factions.rep)
      //local saves 
      let heroes = [...this.heroes.values()].filter(h => h.network == -1)
        .map(h => h.save)
      DB.setItem(".heroes",heroes)
      let crew = [...this.crew.values()].filter(h => h.network == -1)
        .map(h => h.save)
      DB.setItem(".crew",crew)
      //set heroes - for address 
      if(this.UI.main.address) {
        let address = this.UI.main.address
        heroes = [...this.heroes.values()].filter(h => h.network > -1)
          .map(h => h.save)
        DB.setItem(address+".heroes",heroes)
        crew = [...this.crew.values()].filter(h => h.network > -1)
          .map(h => h.save)
        DB.setItem(address+".crew",crew)
      }
      //update ids 
      app.UI.main.heroIds = [...this.heroes.keys()]
      app.UI.main.crewIds = [...this.crew.keys()]
      //update cpx 
      app.UI.main.CPX = this.cpx.slice()
    }
  },
  notify (text,opts) {
    let {layout="bottomCenter",type="info",timeout=1000} = opts
    new Noty({text,layout,type,timeout,theme:"relax"}).show()
  },
  simpleNotify (text,type="info") {
    this.notify(text,{type,timeout:2500})
  },
  newPlayer () {
    //give 100 diamond 
    this.cpx = [100,0,0,0,0,0,0]
    //give 5 heroes 
    let hex, planeId, heroId, hero, block = Math.round(Date.now()/1000);
    for(let i = 0; i < 5; i++){
      //random home plane 
      hex = utils.planeHex(chance.rpg("1d32")[0])
      planeId = ethers.utils.bigNumberify(hex).toString()
      //create hero id  
      heroId = ethers.utils.bigNumberify("0x"+chance.hash()).toString()
      hero = utils.heroData({heroId,planeId,block,xp:0})
      //save hero 
      this.heroes.set(hero.id,hero)
    }
    //save
    this.save()
  }
}
//initialize - plane map 
d3.range(localStorage.getItem("nPlanes")||32).map(i => utils.addPlaneData(i+1,app))
//initialize UI 
UI(app)
//set resolvers
resolvers(app)

//load data 
app.load()


