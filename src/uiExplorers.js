import {formatTokenText} from "../data/tokenlist.js"

const UI = (app)=>{

  Vue.component("ui-explorers", {
    template: "#ui-explorers",
    props: ["adventurers", "explorers", "now", "tokens"],
    data: function() {
      return {
        exid: "",
        act: {},
        search: {},
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
      const shardData = ()=>{
        if (this.exid == "")
          return

        //get shard cool 
        let sid = this.explorers[this.exid]._shard

        app.submit("getExCool", {
          id: sid
        }).then(res=>{
          this.exCool = res.data
        }
        )
      }

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

      setInterval(()=>{
        setShards()
        shardData()
      }
      , 5000)
    },
    computed: {
      moveTime() {
        let shard = this.explorers[this.exid].shard
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
      actOpts(char) {
        //start array - check for cooldown tokens 
        let actions = this.cooldown.length > 0 ? ["Reduce Cooldown"] : []

        if(char.id.includes("exp")){
          if (char._cool < this.now) {
            //explorers get more 
            actions.push("Move", "Explore", "Hire Adventurers")
          }
        }
        else if(char.id.includes("adv")) {
          if (char._cool < this.now) {
            actions.push("Move")
          }
        }
        //set
        Vue.set(char,"act",actions.slice()) 
      },
      cool(cool) {
        if (cool < this.now)
          return "Ready"
        return app.timeFormat(cool - this.now)
      },
      searchTime(t) {
        if (Number(t) < this.now)
          return "Complete"
        return app.timeFormat(Number(t) - this.now)
      },
      move() {
        app.submit("characterMove", {
          id: this.exid,
          to: this.moveTo
        })
        this.act[this.exid] = ""
      },
      reduceCool() {
        let {id, qty} = this.optsReduceCool
        if (qty > this.tokens[id].val)
          return

        //submit 
        app.submit("characterReduceCooldown", {
          id: this.exid,
          coolId: id,
          qty
        })
        this.act[this.exid] = ""
      },
      explore() {
        app.submit("exploreShard", {
          id: this.exid
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
        this.act[this.exid] = ""
      },
      searchForAdventurers() {
        //shard 
        let sid = this.explorers[this.exid]._shard
        //submit 
        app.submit("searchForAdventurers", {
          id: this.exid,
        }).then(res=>{
          //data
          let {id, cool} = res.data
          //save seed 
          localStorage.setItem("adv." + sid, id)
          //cooldown
          app.simpleNotify("Must cooldown by " + cool + " hrs", "warning")
        }
        )
        this.act[this.exid] = ""
      },
      hireAdventurer(adv) {
        let data = {
          id: adv.id,
          _home: adv._home
        }
        app.submit("hireAdventurer", data).then(res=>{
          app.simpleNotify("Hired " + adv.skills.text)
          //delete storage
          localStorage.removeItem("adv." + adv._home)
        }
        )
      }
    }
  })

}
export {UI}

/*
        let gasLimit = 500000;
        //override gas limit
        app.ETH.submit("ExploreShard", "explore", [this.exid], {
          gasLimit
        }).then(res=>{
          console.log(res)
        }
        )

        app.ETH.submit("Characters", "move", [this.exid, this.moveTo])
        */

/*
        //useCooldownToken (uint256 _id, uint256 _ti, uint256 _qty)
        app.ETH.submit("Characters", "spendTokens", [this.exid, ti, qty])
        */
