//handles eth interaction 
import * as eth from "./eth.js"
let eC = eth.getContracts
//UIs
import {UI as factionUI} from "./factions.js"

/* Drawing Functions 
*/
const drawArc = (app)=>{
  let diff = app.UI.main.trouble.diff
  let skillProb = [98.7, 93.8, 81.5, 61.7, 38.27, 18.52, 6.17, 1.23]
  let zp = [1.23, 4.94, 12.35, 19.75, 23.46, 19.75, 12.35, 4.94, 1.23]
  let r = 30

  for (let i = 0; i < 6; i++) {
    if (!app.UI.main.troubleHeroes[i].skillsById && !app.UI.main.troubleCrew[i].skillsById)
      continue;
    let hero = app.UI.main.troubleHeroes[i]
    let crew = app.UI.main.troubleCrew[i]
    //get higher bonus
    let cB = -5
      , hB = -5;
    if (crew.skillsById) {
      cB = crew.skillsById[i] + (crew.approaches.includes(app.UI.main.trouble.approach) ? 1 : 0)
    }
    //define skill and bonus 
    if (hero.skillsById) {
      hB = hero.skillsById[i] + (hero.approaches.includes(app.UI.main.trouble.approach) ? 1 : 0)
    }
    //check for best bonus 
    let AB = cB > hB ? cB : hB
    //calculate probabilities 
    let d = diff - AB
    let p = d < -3 ? 100 : d > 4 ? 0 : skillProb[d + 3]
    let z = d < -4 ? 0 : d > 4 ? 0 : zp[d + 4]
    let f = 100 - p
    //create arc 
    let arc = d3.arc().innerRadius(10).outerRadius(r)
    let pie = d3.pie()([p - z, z, f])
    //select and clear 
    let svg = d3.select("#dpArc-" + i)
    svg.attr("height", r * 2).attr("width", r * 2)
    svg.html("")
    //append the g to shift center
    let vis = svg.append("g").attr("transform", "translate(" + r + "," + r + ")")
    //append the arcs
    vis.selectAll("path").data(pie).enter().append("path").attr("d", arc).attr("fill", (d,j)=>["green", "lightblue", "red"][j])
  }
}

const circlePack = (app)=>{
  let RNG = new Chance(app.params.seed)

  //get data 
  let planes = [...app.planes.values()]
  let h = d3.hierarchy({
    //once for each plane 
    "children": planes.map(p=>{
      return Object.assign({
        children: p.cpx.map(cpx=>{
          return {
            color: ["red", "orange", "yellow", "green", "blue", "purple"][cpx[0] - 1],
            A: cpx[1] / 10
          }
        }
        )
      }, p)
    }
    )
  })
  h.sum(d=>d.A)

  let pack = d3.pack().size([1, 1])(h)
  //first is always full circle 
  let map = h.descendants()
  //now shuffle
  return RNG.shuffle(map)
}

let planetMap = []
const drawCircleMap = (app)=>{
  let {utils} = app
  const fC = 2 * Math.PI
  let iW = window.innerWidth
  let iH = window.innerHeight
  let D = iH < iW ? iH : iW
  //set size
  let canvas = d3.select("#map canvas").attr("height", D).attr("width", D)
  var ctx = canvas.node().getContext("2d")
  ctx.clearRect(0, 0, iW, iH)

  //add data
  let data = circlePack(app)

  //use canvas because there could be a lot of circles  
  //do layer 1 then layer 2
  planetMap = []
  let selected = null
  let owned = []
  data.filter(d=>d.depth == 1).forEach(d=>{
    planetMap.push(d)
    //outline in blue
    if (app.UI.main && (utils.planeHash(app.UI.main.tid) == d.data.hash)) {
      selected = d
    }
    //get owned 
    if (app.UI.main && app.UI.main.planes.includes(d.data._id)) {
      owned.push(d)
    }
    ctx.beginPath()
    ctx.arc(D * d.x, D * d.y, D * d.r, 0, fC)
    ctx.stroke()
  }
  )
  data.filter(d=>d.depth == 2).forEach(d=>{
    ctx.beginPath()
    ctx.arc(D * d.x, D * d.y, D * d.r, 0, fC)
    ctx.fillStyle = d.data.color
    ctx.fill()
    ctx.stroke()
  }
  )
  //display owned 
  owned.forEach(d=>{
    ctx.beginPath()
    ctx.arc(D * d.x, D * d.y, D * d.r, 0, fC)
    ctx.strokeStyle = "green";
    ctx.lineWidth = 5;
    ctx.stroke()
  }
  )
  if (selected) {
    let d = selected
    ctx.beginPath()
    ctx.arc(D * d.x, D * d.y, D * d.r * 1.1, 0, fC)
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 5;
    ctx.stroke()
  }

  //reset 
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;

  canvas.on("click", function() {
    let p = d3.mouse(this)
    //adjust for scaling 
    let x = (p[0] / D)
    let y = p[1] / D
    //scan shards or planets 
    //get the planet 
    let cp = planetMap.find(_p=>{
      let dx = _p.x - x
      let dy = _p.y - y
      return dx * dx + dy * dy < _p.r * _p.r
    }
    )

    app.UI.main.tid = cp.data.i
    //set trouble 
    app.UI.main.trouble = utils.planeTrouble(app.UI.main.day, app.UI.main.planeData._id)
    app.UI.main.trouble.source = app.factions.troubleSource()[cp.data.i]
    app.UI.main.trouble.complete = !app.mayClaim("trouble", cp.data.i, 0)
    app.UI.main.trouble.sCool = app.params.coolPerStress
    //Need Surplus
    let ns = utils.planeNeed(app.UI.main.day, app.UI.main.planeData._id)
    //need resolved  
    if (!app.mayClaim("trade", cp.data.i, 0))
      ns.need = ""
    //surplus used 
    if (!app.mayClaim("trade", cp.data.i, 1))
      ns.surplus = ""
    //set UI 
    app.UI.main.needSurplus = ns
    //
    app.UI.main.show = 0
    //set planet 
    eth.check(app)
    drawCircleMap(app)
  })
}

/* 
UI 
*/

const UI = (app)=>{
  let {utils} = app
  //initialize other UIs 
  factionUI(app)

  //check for resize
  window.addEventListener("resize", ()=>{
    drawCircleMap(app)
  }
  )

  setInterval(()=>{
    drawCircleMap(app)
  }
  , 15000)

  Vue.component('over-text', {
    template: '#over-text',
    data: function() {
      return {
        content: null,
        options: [],
        showClose: false
      }
    },
    mounted() {
      app.UI.overText = this
      let id = app.UI.main.overTextId
      let e = document.getElementById(id)
      if (e) {
        this.content = e.innerHTML
      }
    },
    methods: {
      open(id) {}
    }
  })

  //creates the VUE js instance
  app.UI.main = new Vue({
    el: '#ui-main',
    data: {
      address: "",
      balance: "0",
      cpxNames: ["Diamond", "Ruby", "Citrine", "Topaz", "Emerald", "Sapphire", "Amethyst"],
      approachNames: ["Careful", "Clever", "Flashy", "Forceful", "Quick", "Sneaky"],
      skillNames: ["Arcane", "Combat", "Diplomacy", "Exploration", "Science", "Thievery"],
      skillProb: [98.7, 93.8, 81.5, 61.7, 38.27, 18.52, 6.17, 1.23],
      CPX: [0, 0, 0, 0, 0, 0, 0],
      now: 0,
      //what we show on the overhead 
      show: 0,
      //Plane data 
      planes: [],
      tid: -1,
      maySearch: false,
      searchCost: "0.01",
      nextSearch: 0,
      needSurplus: {},
      tradeId: "",
      //Hero data 
      hid: "",
      heroIds: [],
      heroName: "",
      recruitCost: "0.003",
      recruitCostCPX: "5.0",
      //Trouble
      currentPeriod: 1,
      solveTrouble: false,
      troubleHeroIds: ["", "", "", "", "", ""],
      troubleCrewIds: ["", "", "", "", "", ""],
      trouble: {},
      challengeCost: "0.005",
      //Completed Challenges
      completedChallenges: [],
      //Crew
      day: "0",
      recruitCrewCost: "0.001",
      recruitCrewCostCPX: "1.0",
      crewIds: [],
      crid: "",
      planeCrew: {},
      //
      toCombine: 0,
      toMint: 0,
      cap: 32,
      shareToClaim: 0,
      //Over text control
      overTextId: ""
    },
    mounted() {
      //check if opened before 
      let isReturningPlayer = localStorage.getItem("isReturningPlayer")
      if (!isReturningPlayer || isReturningPlayer == "false") {
        localStorage.setItem("isReturningPlayer", true)
        this.showOverText("welcome")
        //new player 
        newPlayer()
      }
      //check for last address 
      let lastAddress = localStorage.getItem("lastAddress")
      this.address = lastAddress || ""
      //Poll the number of planets 
      setInterval(()=>{
        eth.check(app)
      }
      , 5000)
      setInterval(()=>this.now = Date.now() / 1000, 500)

      //inital push
      eth.check(app)
      drawCircleMap(app)
    },
    computed: {
      day() {
        return Math.round(this.now / (24 * 60 * 60))
      },
      nextSearchTime() {
        let dt = Math.ceil(this.nextSearch - this.now)
        return dt < 0 ? 0 : dt
      },
      nextRecruitTime() {
        let next = app.cooldown[this.planeData._id] || 0
        let dt = Math.ceil(next - this.now)
        return dt < 0 ? 0 : Math.round(dt / 60)
      },
      nextTapTime() {
        let dt = Math.ceil(this.nextTap - this.now)
        return dt < 0 ? 0 : dt
      },
      //Plane data 
      allPlanes() {
        return [...app.planes.values()]
      },
      tradeData() {
        let tD = {}
        if (this.tradeId != "") {
          tD = utils.planeNeed(this.day, this.tradeId)
          //need resolved  
          if (!app.mayClaim("trade", tD.pi, 0))
            tD.need = ""
          //surplus used 
          if (!app.mayClaim("trade", tD.pi, 1))
            tD.surplus = ""
        }
        return tD
      },
      planeData() {
        let plane = {}
        if (this.tid > -1) {
          plane = app.utils.planeData(this.tid)
          //cooldown 
          plane.cool = app.cooldown[plane._id] || 0
        }
        return plane
      },
      //Handle Trouble 
      troubleHeroes() {
        return this.troubleHeroIds.map(id=>id === "" ? {} : app.heroes.get(id))
      },
      troubleLeadFaction () {
        let fid = this.troubleHeroes[this.trouble.skillId].faction || -1
        return fid > -1 ? app.factions.byId(fid) : {}
      },
      troubleCrew() {
        return this.troubleCrewIds.map(id=>id === "" ? {} : app.crew.get(id))
      },
      troubleXP () {
        return this.troubleHeroes.map((H,i) => {
          let b = H.skillsById ? H.skillsById[i] : -4
          return Math.ceil(Math.pow(10, b+1) / 20)
        })
      },
      canSolveTrouble() {
        return this.troubleHeroIds.reduce((state,id)=>state && id != "", true)
      },
      //Hero data
      allHeroes() {
        return this.heroIds.map(id=>app.heroes.get(id))
      },
      heroData() {
        let hero = this.hid == "" ? {} : app.heroes.get(this.hid)
        hero.cool = app.cooldown[hero.id] || 0
        hero.faction = app.factions.byId(hero.faction)
        return hero
      },
      cooldown() {
        let cool = this.hid == "" ? 0 : this.heroData.cool
        //convert to hours
        let dt = (cool - this.now) / (60 * 60)
        return dt < 0 ? "" : dt.toFixed(2)
      },
      heroCanAct() {
        return this.heroIds.map(hi=>(app.cooldown[hi] || 0) < this.now)
      },
      //Crew data
      allCrew() {
        return this.crewIds.map(id=>app.crew.get(id))
      },
      crewData() {
        return this.crid == "" ? {} : app.crew.get(this.crid)
      },
      crewCanAct() {
        return this.crewIds.map(hi=>(app.cooldown[hi] || 0) < this.now)
      },
      //
      maxCPX() {
        return this.CPX.slice(1).reduce((min,val)=>{
          return Number(val) < min ? Number(val) : min
        }
        , 99999)
      },
    },
    methods: {
      reset() {
        //remove player status 
        localStorage.setItem("isReturningPlayer", false)
        //clear db 
        DB.clear().then()
        window.location = ""
      },
      showOverText(id) {
        this.overTextId = id
        this.show = 6
      },
      drawArc() {
        drawArc(app)
      },
      skillDiff(sid) {
        let t = this.trouble
        let h = this.troubleHeroes[sid]
        let c = this.troubleCrew[sid]
        let diff = t.diff
        //determine higher bonus 
        let cB = -5
        //if crew 
        if (c.skillsById) {
          cB = c.skillsById[sid] + (c.approaches.includes(t.approach) ? 1 : 0)
        }
        let hB = h.skillsById[sid] + (h.approaches.includes(t.approach) ? 1 : 0)
        //check for approach bonus 
        let AB = cB > hB ? cB : hB
        let d = diff - (AB)
        let p = d < -3 ? 100 : d > 4 ? 0 : this.skillProb[d + 3]
        return {
          d,
          p
        }
      },
      conductSearch() {
        return
        //pay for search 
        let pay = {
          value: ethers.utils.parseUnits(this.searchCost, "ether"),
        }

        eC().OutlandsRegistry.create(0, 0, 0, pay).then(t=>{
          app.simpleNotify("Transaction sent: " + t.hash, "info")
        }
        )
      },
      Recruit() {
        if (this.address != "") {
          let pay = {
            value: ethers.utils.parseUnits(this.recruitCost, "ether")
          }
          eC().OutlandsRegistry.create(1, this.planeData._id, 0, pay).then(t=>{
            app.simpleNotify("Transaction sent: " + t.hash, "info")
          }
          )
        } else {
          //block is time 
          let block = Math.round(Date.now() / 1000)
          //no double click 
          this.nextRecruit = block + app.params.timeBetween[0]
          //deduct cpx 
          app.cpx[0] -= Number(this.recruitCostCPX)
          //update 
          this.CPX = app.cpx.slice()
          //plane data and set cool 
          let planeId = this.planeData._id
          app.cooldown[planeId] = this.nextRecruit
          //create hero id  
          let heroId = ethers.utils.bigNumberify("0x" + chance.hash()).toString()
          let hero = utils.heroData({heroId, planeId, block, xp:0})
          this.heroIds.push(hero.id)
          //save hero 
          app.heroes.set(hero.id, hero)
          app.simpleNotify("You just recruited hero " + hero.name, "info")
          //save 
          app.save()
        }
      },
      recruitCrew(i) {
        if (this.address == "") {
          //local recruit 
          //block is time 
          let block = Math.round(Date.now() / 1000)
          //no double click 
          this.nextRecruit = block + app.params.timeBetween[1]
          //deduct cpx 
          app.cpx[0] -= Number(this.recruitCrewCostCPX)
          //update 
          this.CPX = app.cpx.slice()
          //plane data and set cool 
          let planeId = this.planeData._id
          app.cooldown[planeId] = this.nextRecruit
          //make local claim 
          app.makeClaim("crew", this.planeData.i, i)
          //new crew 
          //create id  
          let crewId = ethers.utils.bigNumberify("0x" + chance.hash()).toString()
          let baseHash = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'uint256'], [app.day, planeId, i])
          let crew = utils.crewData(crewId, this.planeData, baseHash)
          this.crewIds.push(crew.id)
          //save 
          app.crew.set(crew.id, crew)
          app.simpleNotify("You just recruited crew " + crew.name, "info")
          //save 
          app.save()
        } else {
          let pay = {
            value: ethers.utils.parseUnits(this.recruitCrewCost, "ether")
          }
          eC().OutlandsRegistry.create(2, this.planeData._id, i, pay).then(t=>{
            app.simpleNotify("Transaction sent: " + t.hash, "info")
          }
          )
        }
      },
      claimHeroFunds() {},
      combineCPX() {
        let val = this.toCombine
        //reduce all colors 
        for(let i = 1; i < 7; i++){
          app.updateCPX(i, -val)
        }
        //resultant diamond is random 
        let dVal = val * (70+chance.rpg("2d12",{sum:true})) / 100
        app.updateCPX(0, dVal)
        //notify
        let text = "You have created " + dVal.toFixed(2) + " Diamond."
        app.simpleNotify(text, "success")
        app.save()
        /*
          let val = ethers.utils.parseUnits(this.toCombine,'ether')
          eC().cpxRegistry.makeDiamond(val.toString()).then(t => {
              app.simpleNotify("Transaction sent: "+t.hash,"info")
          })
          */
      },
      saveHero() {
        let h = this.heroData
        app.heroes.set(h.id, h)
        app.save()
      },
      commitToSolveTrouble() {
        if (this.address == "") {
          //local 
          this.trouble.player = "0x0"
          //plane data and set cool 
          let plane = this.planeData
          //make local claim 
          app.makeClaim("trouble", plane.i, 0)
          //run trouble 
          let tR = app.resolveChallenge({
            crew: this.troubleCrew,
            heroes: this.troubleHeroes,
            challenge: this.trouble
          })
          //notify
          tR.heroes.forEach((h,i)=>{
            if (tR.xp[i] > 0) {
              let text = h.name + " has earned " + tR.xp[i] + " XP."
              app.simpleNotify(text, "success")
              //give xp 
              app.giveXP(h.id, tR.xp[i])
            }
            //cool notify 
            let cool = Number(tR.cool[i])
            let delta = Math.round((cool - this.now) / 60)
            if (delta > 0) {
              let text = h.name + " has " + delta + " minutes of cooldown."
              app.simpleNotify(text, "warning")
              //set cool 
              app.cooldown[h.id] = cool
            }
          }
          )
          if (tR.reward[1] > 0) {
            let text = "You have earned " + tR.reward[1] + " " + this.cpxNames[tR.reward[0]] + "."
            app.simpleNotify(text, "success")
            //provide CPX 
            app.updateCPX(tR.reward[0], tR.reward[1])
            //update rep of leading faction 
            let faction = app.factions.byId(tR.faction)
            let repId = tR.faction+".p"+plane.i
            app.factions.changeRep(repId,1)
            app.simpleNotify("The "+faction.name+" has gained 1 Rep.", "success")
            //if there is a faction causing trouble, reduce rep between
            if(this.trouble.source && this.trouble.source.id != tR.faction){
              let tsid = this.trouble.source.id
              //lowest id first 
              repId = tsid < tR.faction ? tsid+".f"+tR.faction : tR.faction+".f"+tsid
              app.factions.changeRep(repId,-1)
            }
          }
          //turn the challenge into hex  
          let hex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(tR.res)))
          //save challenge data 
          let cid = this.trouble.period + "." + plane.i
          app.challenges[cid] = hex
          //save 
          app.save()
          //close display
          this.troubleHeroIds = ["", "", "", "", "", ""]
          this.tid = -1
          this.show = -1
        }
        /*
          let hids = this.troubleHeroIds.slice()
          eth.submitChallenge(app, this.planeData._id, hids, [])
          this.troubleHeroIds=["","","","","",""]
          */
      },
      makeTrade(from, to) {
        if (from.surplus != to.need)
          return
        let ri = utils.RESOURCES.indexOf(from.surplus)
        let color = 1 + ri % 6
        let random = 2 + chance.rpg("2d4", {
          sum: true
        })
        let value = Math.pow(random, from.r - 1 == 0 ? -1 : from.r - 1)
        //claim - need is 0, surplus is 1 
        app.makeClaim("trade", to.pi, 0)
        app.makeClaim("trade", from.pi, 1)
        //provide CPX 
        app.updateCPX(color, value)
        //notify 
        let text = from.surplus + " Trade Made, you earned " + value + " " + this.cpxNames[color] + "."
        app.simpleNotify(text, "info")
        //close display 
        this.tid = -1
        this.tradeId = ""
        this.show = -1
      },
      reduceCool() {
        if(app.cpx[0] < 1) return 
        //take cpx 
        app.updateCPX(0,-1) 
        //reduce cool by an hour 
        let id = this.heroData.id
        let _cool = app.cooldown[id] - (60*60)
        this.heroData.cool = app.cooldown[id] = _cool
      }
    }
  })

}

export {UI}
