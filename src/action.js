//token data 
import {formatTokenText} from "../data/tokenlist.js"

const HTML = `
<div class="m-1" align="left" v-if="action!=''">
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
  <div v-if="action == 'hire'">
    <div class="d-flex justify-content-between">
      <div>
        <div>{{actor.shard.realmName}} - {{actor.shard.seed}}</div>
        <div>{{actor.shard.anchor.text}} [{{actor.shard.anchor.rarity}}] {{actor.shard.anchor.risk[1]}} Risk</div>
        <div>To hire them, you first have to find them. The time it takes depends upon the anchor of the shard.</div>
      </div>
      <button class="btn btn-outline-success" type="button" @click="searchForAdventurers()">Search</button>
      </div>
    </div>
    <!--END HIRE ADVENTURERS---------------------------------------------->
  </div>
</div>
`

const UI = (app) => {
  const ID_EXCOOL = "ecl"
  let UIC

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
        exCool: 0
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
      searchForAdventurers() {
        //shard 
        let sid = this.actor._shard
        //submit 
        app.submit("searchForAdventurers", {
          id: this.actor.id,
        }).then(res=>{
          //data
          let {id, cool} = res.data
          //save seed 
          localStorage.setItem("adv." + sid, id)
          //cooldown
          app.simpleNotify("Must cooldown by " + cool + " hrs", "warning")
        }
        )

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
    actor._act = ""
    //define getter for actions  
    Object.defineProperty(actor, 'actions', { get: function() { 
        if(this._cool > app.now) {
          return [["cool","Reduce Cooldown"]]
        }
        else {
          return [["move","Move"]]
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
        else {
          return [["move","Move"], ["explore","Explore Shard"], ["hire","Hire Adventurer"]]
        }
      } 
    })
  } 

  return {explorer, adventurer}

}

export {ActionManager}