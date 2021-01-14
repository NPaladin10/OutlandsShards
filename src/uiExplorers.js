const UI = (app)=>{
  const cIds = [101, 102, 103, 104, 105, 106]

  Vue.component("ui-explorers", {
    template: "#ui-explorers",
    props: ["explorers", "now", "tokens"],
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
        showShard: ["", ""]
      }
    },
    mounted() {
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
        return Object.entries(this.tokens).filter(t=> t[1].cool && t[1].val > 0)
      },
      actOpts() {
        let actions = ["Move", "Explore", "Hire Adventurers"]

        if (this.cooldown.length > 0)
          actions.push("Reduce Cooldown")

        return actions
      }
    },
    methods: {
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
        if(qty > this.tokens[id].val) return 

        //submit 
        app.submit("characterReduceCooldown", {id:this.exid, coolId:id, qty})
        this.act[this.exid] = ""
      },
      explore() {
        let gasLimit = 500000;
        //override gas limit
        app.ETH.submit("ExploreShard", "explore", [this.exid], {
          gasLimit
        }).then(res=>{
          console.log(res)
        }
        )
      },
      searchForAdventurers() {
        let _d8Tod4 = [1, 1, 2, 2, 2, 3, 3, 4]
          , riskCooldown = [[4, 6, 10, 16], [10, 12, 16, 22], [16, 18, 22, 28], [22, 24, 28, 34]]
          , shard = this.explorers[this.exid]._shard
          , d4 = chance.d4() - 1
          , seed = "0x" + chance.hash({
          length: 64
        });
        let {rarity, risk} = shard.anchor

        let cool = this.now + riskCooldown[risk[0]][_d8Tod4[d4 + rarity - 1] - 1]

        Vue.set(this.search, this.exid, {
          what: "Adventurer",
          cool,
          res: app.ETH.adventurerFromSeed(seed)
        })

        this.act[this.exid] = ""
      },
      hireAdventurer(id) {
        let res = this.search[id].res
        app.ETH.submit("Adventurers", "mint", [res._seed])
      }
    }
  })

}
export {UI}

/*
        app.ETH.submit("Characters", "move", [this.exid, this.moveTo])
        */

/*
        //useCooldownToken (uint256 _id, uint256 _ti, uint256 _qty)
        app.ETH.submit("Characters", "spendTokens", [this.exid, ti, qty])
        */
