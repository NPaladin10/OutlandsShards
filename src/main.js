//chance
import "../lib/chance.min.js"
//localforage 
import "../lib/localforage.1.7.1.min.js";
//Save db for Indexed DB - localforage
const DB = localforage.createInstance({ name: "OP", storeName: "OutlandsPlanes" })

//Seed for generation
const seed = "OutlandsPlanes2019"
//handles eth interaction 
import * as eth from "./eth.js"
let eC = eth.getContracts
//pull utility functions like hash and data generation
import {challengeCheck} from "./resolvers.js"
import {init as uInit} from "./utilities.js"
const utils = uInit(seed)

//generic application 
const app = {
  DB,
  UIMain : null,
  utils,
  //cross reference tokens 
  tokensPlanes : new Map(),
  tokensHeroes : new Map(),
  heroCooldown : new Map(),
  heroXP : new Map(),
  planets : new Map(),
  challenges : new Map(),
  load () {
    DB.getItem(this.UIMain.address+".challenges").then(c => this.challenges = new Map(c))
    DB.getItem(this.UIMain.address+".heroXP").then(c => this.heroXP = new Map(c))
    DB.getItem(this.UIMain.address+".heroCooldown").then(c => this.heroCooldown = new Map(c))
    DB.getItem(this.UIMain.address+".ownedPlanes").then(op => this.UIMain.owns = op.slice())
    DB.getItem(this.UIMain.address+".heroes").then(heroes => {
      //load heroes
      heroes.forEach(h => {
        this.tokensHeroes.set(h.id,utils.heroData(h.id,h.plane,h.hash,h.xp))
      })
      //set UIMain
      this.UIMain.heroIds = [...this.tokensHeroes.keys()]
    })
  },
  save () {
    if(this.UIMain && this.UIMain.address) {
      DB.setItem(this.UIMain.address+".challenges",this.challenges)
      DB.setItem(this.UIMain.address+".heroXP",this.heroXP)
      DB.setItem(this.UIMain.address+".heroCooldown",this.heroCooldown)
      DB.setItem(this.UIMain.address+".ownedPlanes",this.UIMain.owns.slice())
      //set heroes 
      let heroes = this.UIMain.heroIds.map(hid => {
        let h = this.tokensHeroes.get(hid)
        return {
          id : h.id,
          plane : h.plane,
          hash : h.baseHash,
          xp : h._xp
        }
      })
      DB.setItem(this.UIMain.address+".heroes",heroes)
    }
  },
  notify (text,opts) {
    let {layout="bottomCenter",type="info",timeout=1000} = opts
    new Noty({text,layout,type,timeout,theme:"relax"}).show()
  },
  simpleNotify (text,type="info") {
    this.notify(text,{type,timeout:2500})
  },
}

//initialize - plane map 
d3.range(localStorage.getItem("nPlanes")||32).map(i => utils.addPlaneData(i,app.planets,app.tokensPlanes))

//TESTING
//challengeCheck(0)

/* Drawing Functions 
*/
const drawArc = () => {
  let diff =  app.UIMain.trouble.diff 
  let skillProb = [98.7,93.8,81.5,61.7,38.27,18.52,6.17,1.23]
  let zp = [1.23,4.94,12.35,19.75,23.46,19.75,12.35,4.94,1.23]
  let r = 30

  for(let i = 0; i < 6; i++){
    if(!app.UIMain.troubleHeroes[i].skillsById) continue;
    let hero = app.UIMain.troubleHeroes[i]
    //define skill and bonus 
    let s = hero.skillsById[i]
    //check for approach bonus 
    let AB = hero.approaches.includes(app.UIMain.trouble.approach) ? 1 : 0
    //calculate probabilities 
    let d = diff - (s+AB) 
    let p = d < -3 ? 100 : d > 4 ? 0 : skillProb[d+3]
    let z = d < -4 ? 0 : d > 4 ? 0 : zp[d+4]   
    let f = 100 - p 
    //create arc 
    let arc = d3.arc().innerRadius(10).outerRadius(r) 
    let pie = d3.pie()([p-z,z,f])
    //select and clear 
    let svg = d3.select("#dpArc-"+i)
    svg.attr("height",r*2).attr("width",r*2)
    svg.html("")
    //append the g to shift center
    let vis = svg.append("g").attr("transform", "translate(" + r + "," + r + ")")
    //append the arcs
    vis.selectAll("path").data(pie).enter().append("path")
      .attr("d",arc)
      .attr("fill",(d,j) => ["green","lightblue","red"][j])
  }
}

const circlePack = () => {
  let RNG = new Chance(seed)

  //get data 
  let planes = [...app.tokensPlanes.values()]
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
      if(app.UIMain && (utils.planeHash(app.UIMain.tid) == d.data.hash)){
        selected = d 
      }
      //get owned 
      if(app.UIMain && app.UIMain.owns.includes(d.data.i)) {
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
      
      app.UIMain.tid = cp.data.i
      app.UIMain.trouble = utils.planeTrouble(app.UIMain.currentPeriod ,app.UIMain.tid)
      //set planet 
      eth.check(app)
      drawCircleMap()
    })
}

/* UI 
*/

//creates the VUE js instance
app.UIMain = new Vue({
    el: '#ui-main',
    data: {
        address: "",
        balance: 0,
        cpxNames : ["Diamond","Ruby","Citrine","Topaz","Emerald","Sapphire","Amethyst"],
        approachNames : ["Careful", "Clever", "Flashy", "Forceful", "Quick", "Sneaky"],
        skillNames : ["Arcane", "Combat", "Diplomacy", "Exploration", "Science", "Thievery"],
        skillProb : [98.7,93.8,81.5,61.7,38.27,18.52,6.17,1.23],
        CPX : [0,0,0,0,0,0,0],
        //what we show on the overhead 
        show: -1,
        //Plane data 
        owns : [],
        tid : -1,
        maySearch: false,
        searchCost : "0.01",
        nextSearch: 0,
        //Hero data 
        hid : -1,
        heroIds : [],
        heroName : "",
        recruitCost : "0.003",
        nextRecruit: 0,
        //Trouble
        currentPeriod : 0,
        solveTrouble : false,
        troubleHeroIds : [-1,-1,-1,-1,-1,-1],
        trouble : {},
        challengeCost : "0.005",
        //Completed Challenges
        completedChallenges : [],
        //
        toCombine: 0,
        toMint: 0,
        cap: 32,
        now : 0,
        shareToClaim : 0,
        nextTap: 0,
        rid : 0,
    },
    mounted() {
      //Poll the number of planets 
      setInterval(()=>{
        eth.check(app)
      },5000)
      setInterval(()=> this.now = Date.now()/1000,500)

      //inital push
      eth.check(app)   
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
        //Handle Trouble 
        troubleHeroes () {
          let h = this.troubleHeroIds.map(id => id > -1 ? app.tokensHeroes.get(id) : {})
          return h 
        },
        canSolveTrouble () {
          return this.troubleHeroIds.reduce((state,id) => state && id > -1,true)
        },
        //Hero data
        heroData () {
          return this.hid == -1 ? {} : app.tokensHeroes.get(this.hid)
        },
        cooldown () {
          let cool = this.hid == -1 ? 0 : this.heroData.cool
          //convert to hours
          let dt = (cool - this.now)/(60*60)
          return dt < 0 ? "" : dt.toFixed(2)
        },
        canAct () {
          return this.heroIds.map(hi => app.tokensHeroes.get(hi).cool < this.now)
        },
        //
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
        drawArc() { drawArc() },
        skillDiff (sid) {
          let t = this.trouble
          let h = this.troubleHeroes[sid]
          let diff = t.diff
          let s = h.skillsById[sid]
          //check for approach bonus 
          let AB = h.approaches.includes(t.approach) ? 1 : 0
          let d = diff - (s + AB) 
          let p = d < -3 ? 100 : d > 4 ? 0 : this.skillProb[d+3]
          return {d,p}
        },
        conductSearch() {
          //pay for search 
          let pay = {
            value: ethers.utils.parseUnits(this.searchCost,"ether"),
          }
          
          eC().outlandsPlanes.Search(pay).then(t => {
            console.log("Transaction sent: "+t.hash)
          })
        },
        Recruit () {
          let pay = {
            value: ethers.utils.parseUnits(this.recruitCost,"ether")
          }
          eC().outlandsHeroes.Recruit(this.tid, pay).then(t => {
            console.log("Transaction sent: "+t.hash)
          })
        },
        claimHeroFunds() {

        },
        tap(){
          //<button class="btn btn-outline-success btn-sm" type="button" v-if="tid>-1" @click="tap()" :disabled="nextTapTime>0">{{tid}} Tap</button>
          eC().outlandsPlanes.Tap(Number(this.pid), Number(this.sid)).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        combineCPX() {
          let val = ethers.utils.parseUnits(this.toCombine,'ether')
          eC().cpxRegistry.makeDiamond(val.toString()).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        },
        saveHero () {
          let h = this.heroData
          tokensHeroes.set(this.hid,h)
        },
        commitToSolveTrouble () {
          //pay 
          let pay = {
            value: ethers.utils.parseUnits(this.challengeCost,"ether"),
          }
          let hids = this.troubleHeroIds.slice()
          eC().outlandsTrouble.submitChallenge(this.tid, hids, pay).then(t => {
              console.log("Transaction sent: "+t.hash)
          })
        }
    }
})

//check for resize
window.addEventListener("resize", ()=> {
  drawCircleMap()
})



setInterval(()=>{
    drawCircleMap()
},15000)