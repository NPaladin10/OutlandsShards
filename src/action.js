//token data 
import {formatTokenText} from "../data/tokenlist.js"

const OPPOSE = `
<div class="px-3" v-if="action == 'oppose'">
  <div class="d-flex justify-content-between mb-2" v-for="A in actor.shard.characters" v-if="A._cool < now">
    <div>{{A.what}} {{A.seed}}</div>
    <button class="btn btn-outline-success" type="button" @click="addOppose(A.id)">{{toOppose.includes(A.id) ? 'Remove' : 'Add'}}</button>
  </div>
  <button class="btn btn-block btn-outline-success" type="button" @click="oppose()" v-if="toOppose.length>0">Oppose Trouble</button>
</div>
`

const HTML = `
<div class="m-1 px-2" align="left" v-if="action!=''">
  <!--MOVE---------------------------------------------->
  <div class="input-group" v-if="action == 'move'">
    <div class="input-group-prepend">
      <span class="input-group-text">Shard</span>
    </div>
    <select class="custom-select" v-model="moveTo">
      <option v-for="s in shards" :value="s.id" v-if="s.id != actor._shard">{{s.realmName}} - {{s.seed}}</option>
    </select>
    <div class="input-group-append">
      <span class="input-group-text" v-if="moveTo != '' && moveTime>0">{{moveTime}} hours</span>
      <button class="btn btn-outline-secondary" type="button" @click="move()">Move</button>
    </div>
  </div>
  `+OPPOSE+`
  <!--EXPLORE---------------------------------------------->
  <div v-if="action == 'explore'">
    <div class="d-flex justify-content-between">
      <div>
        <div>{{actor.shard.realmName}} - {{actor.shard.seed}} <span v-if="exCool > now">({{exCoolRemain}})</span></div>
        <div>{{actor.shard.anchor.text}} [{{actor.shard.anchor.rarity}}] {{actor.shard.anchor.risk[1]}} Risk</div>
      </div>
      <button class="btn btn-outline-success" type="button" @click="explore()" :disabled="exCool>now">Explore</button>
    </div>
  </div>
  <!--END EXPLORE---------------------------------------------->
  <!--EXPLORER COOLDOWN---------------------------------------------->
  <div class="input-group" v-if="action == 'cool'">
    <div class="input-group-prepend">
      <span class="input-group-text">Reduce by</span>
    </div>
    <select class="custom-select" v-model="optsReduceCool.id">
      <option v-for="c in cooldown" :value="c[0]">{{c[1].name}} [{{c[1].val}}]</option>
    </select>
    <div class="input-group-prepend">
      <span class="input-group-text">#</span>
    </div>
    <input type="number" class="form-control" v-model="optsReduceCool.qty">
    <div class="input-group-append">
      <button class="btn btn-outline-secondary" type="button" @click="reduceCool()">Reduce</button>
    </div>
  </div>
  <!--END COOLDOWN---------------------------------------------->
  <!--EXPLORER HIRE ADVENTURERS---------------------------------------------->
  <div v-if="action == 'elem'">
    <div class="d-flex justify-content-between">
      <div>
        <div>{{actor.shard.realmName}} - {{actor.shard.seed}}</div>
        <div>{{actor.shard.anchor.text}} [{{actor.shard.anchor.rarity}}] {{actor.shard.anchor.risk[1]}} Risk</div>
        <div>You may search for an elemental to tame. The time it takes depends upon the anchor of the shard.</div>
      </div>
      <button class="btn btn-outline-success" type="button" @click="searchForElemental()">Search</button>
      </div>
    </div>
    <!--END HIRE ADVENTURERS---------------------------------------------->
  </div>
</div>
`

const ACTIVETROUBLE = `
<div class="border p-1 px-2">
  <div class="d-flex justify-content-between">
    <div>
      <div>{{trouble.shard.realmName}} - {{trouble.shard.seed}}</div>
      <div>Trouble [{{trouble.rank}}]: {{trouble.skillText}} ({{trouble._c.length}})</div>
    </div>
    <button class="btn btn-warning" type="button" @click="retreat()">Retreat</button>
  </div>
  <div class="mt-1" align="center">Current Challenge ({{trouble.step+1}}/{{trouble._c.length}}): {{trouble.cText[trouble.step]}}</div>
  <div class="mb-2 px-3">
    <div class="d-flex justify-content-between" v-for="(A,i) in trouble.actors">
      <div>
        {{A.what}} {{A.seed}}, {{A.skills.text}} ({{trouble.dmg[i] >=5 ? 'Knocked Out' : A.id==ai ? 'Leading' : A.id == spt ? 'Supporting' : 'In Reserve'}})
        <div class="circle circle-sm bg-danger" v-for="n in trouble.dmg[i]"></div>
      </div>
      <div class="btn-group" role="group" v-if="trouble.dmg[i] < 5">
        <button class="btn btn-outline-success" type="button" @click="ai= A.id==ai ? '' : A.id">{{ai==A.id ? 'Reserve' : 'Lead'}}</button>
        <button class="btn btn-outline-success" type="button" @click="spt= A.id == spt ? '' : A.id" v-if="ai!=A.id">{{spt==A.id ? 'Reserve' : 'Support'}}</button>
      </div>
    </div>
  </div>
  <button class="btn btn-block btn-outline-success" type="button" @click="challenge()" v-if="ai != ''">Challenge Trouble</button>
</div>
`

const UI = (app) => {
  const ID_EXCOOL = "ecl"
  let UIC

  Vue.component("ui-active-trouble", {
    template: ACTIVETROUBLE,
    props: ["trouble", "now"],
    data: function() {
      return {
        ai : "",
        spt : ""
      }
    },
    mounted() {},
    methods : {
      removeTrouble (cool) {
        let {actors} = this.trouble
        //notify
        cool.forEach((c,j) => {
          //cooldown
          if(c>0) app.simpleNotify(actors[j].seed+" must cooldown by " + c + " hrs", "warning")
        })
        //remove trouble
        let i = app.UI.main.activeTrouble.map(t => t.id).indexOf(this.trouble.id)
        app.UI.main.activeTrouble.splice(i,1)
      },
      challenge () {
        let {ai, spt} = this
        let actors = app.UI.main.actors
        let dmg = this.trouble.dmg.slice()

        app.trouble.challenge(app.player, this.trouble, actors[ai], spt == "" ? null : actors[spt])
          .then(res => {
            let {data} = res  

            //check if complete 
            if(data.step >= this.trouble._c.length){
              //reward notify 
              formatTokenText(data.T).forEach(t=> app.simpleNotify("Received " + t, "success"))
              //remove 
              this.removeTrouble(data.cool)
              //solved 
              this.trouble.shard._trouble = false 
            }
            else {
              //alert
              if(data.dmg.reduce((s,v)=> s+v,0) > dmg.reduce((s,v)=>s+v,0)) { 
                if(data.step > this.trouble.step) app.simpleNotify("Success, but the Adventurers took damage.", "warning")
                else app.simpleNotify("Fail! The Adventurers took damage.","error")
              }
              else {
                app.simpleNotify("Success!")
              }  

              //update damage and step 
              this.trouble.dmg = data.dmg.slice()
              this.trouble.step = data.step
            }
          })

        this.ai = ""
        this.spt = ""
      },
      retreat () {
        let actors = this.trouble.actors

        //retreat and notify of cooldown
        app.trouble.retreat(app.player, this.trouble)
          .then(res => this.removeTrouble(res.data))        
      }
    }
  })

  const resetAction = (id) => {
    app.UI.characters.action[id] = ""
  }

  Vue.component("ui-actions", {
    template: HTML,
    props: ["action", "actor", "now", "tokens"],
    data: function() {
      return {
        shards: [],
        moveTo: "",
        optsReduceCool: {
          id: "",
          qty: 0,
        },
        showShard: ["", ""],
        exCool: 0,
        toOppose : []
      }
    },
    mounted() {
      UIC = app.UI.characters

      const setShards = ()=>{
        this.shards = app.UI.main.shards.slice().sort(function(a, b) {
          if (a.realmName < b.realmName) {
            return -1;
          }
          if (a.realmName > b.realmName) {
            return 1;
          }
          return 0;
        })
      }

      setShards()

      setInterval(async ()=>{
        setShards()

        if(this.action == "explore") {
          //pull cooldown of shard 
          let {data} = await app.submit("getStats",{id:this.actor._shard, sids:[ID_EXCOOL]}) 
          this.exCool = data[0]
        }
      }
      , 5000)
    },
    computed: {
      moveTime() {
        let {shard} = this.actor
        if (!shard)
          return 0

        let from = shard.id
        return this.moveTo != "" ? app.characters.travelTime(from, this.moveTo) / 3600 : 0
      },
      cooldown() {
        return Object.entries(this.tokens).filter(t=>t[1].cool && t[1].val > 0)
      },
      exCoolRemain() {
        return this.exCool < this.now ? "" : app.timeFormat(this.exCool - this.now)
      },
    },
    methods: {
      addOppose (id) {
        let i = this.toOppose.indexOf(id) 

        if(i > -1){
          this.toOppose.splice(i,1)
          this.toOppose = this.toOppose.slice()
        }
        else {
          this.toOppose.push(id)
        }
      },
      oppose () {
        let UI = app.UI.main 

        app.trouble.oppose(app.player, this.toOppose.map(id => UI.actors[id]))
          .then(res => {
            let {data} = res
            let actors = data._act.map(id => UI.actors[id])
            let shard = actors[0].shard 

            app.UI.main.activeTrouble.push(Object.assign({},data,{actors, shard, _data: data},shard.trouble))
          })
        //clear action 
        resetAction(this.actor.id)
      },
      move() {
        app.submit("characterMove", {
          id: this.actor.id,
          to: this.moveTo
        })
        
        //clear action 
        resetAction(this.actor.id)
      },
      reduceCool() {
        let {id, qty} = this.optsReduceCool
        if (qty > this.tokens[id].val)
          return

        //submit 
        app.submit("characterReduceCooldown", {
          id: this.actor.id,
          coolId: id,
          qty
        })

        //clear action 
        resetAction(this.actor.id)
      },
      explore() {
        app.submit("exploreShard", {
          id: this.actor.id 
        }).then(res=>{
          //format and notify
          formatTokenText(res.data.T).forEach(t=>{
            //notify
            app.simpleNotify("Received " + t)
          }
          )

          //cooldown
          app.simpleNotify("Must cooldown by " + res.data.cool + " hrs", "warning")
        }
        )
        
        //clear action 
        resetAction(this.actor.id)
      },
      searchForElemental() {
        //shard 
        let {actor} = this 
        //submit 
        let {data} = app.characters.searchForElemental(actor) 
        let {id, cool} = data
        //save seed 
        localStorage.setItem("ele." + actor._shard, id)
        //cooldown
        app.simpleNotify("Must cooldown by " + cool + " minutes", "warning")
        //clear action 
        resetAction(this.actor.id)
      }
    }
  })

}


const ActionManager = (app) => {
  //initialize UI
  UI(app)

  //adventurer actions 
  const adventurer = (actor) => {
    let aT = app.UI.main.activeTrouble
    actor._act = ""
    //define getter for actions  
    Object.defineProperty(actor, 'actions', { get: function() { 
        //check if engaged in trouble 
        if(aT.map(t => t._act).flat().includes(this.id)){
          return []
        }

        if(this._cool > app.now) {
          return [["cool","Reduce Cooldown"]]
        }
        else {
          let actions = [["move","Move"],["elem", "Search for an Elemental"]]
          //check for trouble 
          if(actor.shard._trouble){
            actions.push(["oppose","Oppose Trouble"])
          }
          //check for explore 
          if(actor.shard.ecl < app.now){
            actions.push(["explore","Explore Shard"])
          }

          return actions
        }
      } 
    })
  }

  //explorer actions 
  const explorer = (actor) => {
    actor._act = ""
    //define getter for actions  
    Object.defineProperty(actor, 'actions', { get: function() { 
        if(this._cool > app.now) {
          return [["cool","Reduce Cooldown"]]
        }
      } 
    })
  } 

  return {explorer, adventurer}

}

export {ActionManager}