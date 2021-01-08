const UI = (app)=>{
  const cIds = [101,102,103,104,105,106]

  Vue.component("ui-explorers", {
    template: "#ui-explorers",
    props : ["explorers","now","tokens"],
    data: function() {
      return {
        exid : "",
        act : {},
        search : {},
        shards : [],
        moveTo : "",
        optsReduceCool : {
          id: "",
          qty : 0,
        },
        showShard : ["",""]
      }
    },
    mounted() {
      const setShards = () => {
        this.shards = app.shardArray.slice().sort(function(a, b){
            if(a.text < b.text) { return -1; }
            if(a.text > b.text) { return 1; }
            return 0;
        })
      }
      setShards()

      setInterval(()=>{
        setShards()
      },5000)
    },
    computed: {
      moveTime () {
        let _shard = this.explorers[this.exid]._shard
        if(!_shard) return 0 

        let from = _shard._seed
        return this.moveTo > -1 ? app.travelTime(from, this.moveTo) : 0  
      },
      cooldown () {
        return Object.entries(this.tokens).filter(t => cIds.includes(Number(t[0])))
      },
      actOpts () {
        let actions = ["Move", "Explore", "Hire Adventurers"]

        if(this.cooldown.length>0) actions.push("Reduce Cooldown")

        return actions
      }
    },
    methods: {
      cool (cool) {
        if(cool < this.now) return "Ready"
        return app.timeFormat(cool - this.now)    
      },
      searchTime (t) {
        if(Number(t) < this.now) return "Complete"
        return app.timeFormat(Number(t) - this.now)
      },
      move () {
        /*
        app.ETH.submit("Characters", "move", [this.exid, this.moveTo])
        */
        app.server.characterMove(this.exid, this.moveTo)
        this.act[this.exid] = ""
      },
      reduceCool()
      {
        let {id, qty} = this.optsReduceCool
        /*
        //useCooldownToken (uint256 _id, uint256 _ti, uint256 _qty)
        app.ETH.submit("Characters", "spendTokens", [this.exid, ti, qty])
        */

        app.server.characterReduceCooldown(this.exid, id, qty)
        this.act[this.exid] = ""
      },
      explore () {
        let gasLimit = 500000; //override gas limit
        app.ETH.submit("ExploreShard", "explore", [this.exid], {gasLimit}).then(res => {
          console.log(res)
        })
      },
      searchForAdventurers () {
        let _d8Tod4 = [1,1,2,2,2,3,3,4]
          , riskCooldown = [[4,6,10,16],[10,12,16,22],[16,18,22,28],[22,24,28,34]]
          , shard = this.explorers[this.exid]._shard
          , d4 = chance.d4() - 1
          , seed = "0x"+chance.hash({length:64});
        let {rarity, risk} = shard.anchor

        let cool = this.now + riskCooldown[risk[0]][_d8Tod4[d4+rarity-1]-1]

        Vue.set(this.search,this.exid,{what:"Adventurer", cool, res: app.ETH.adventurerFromSeed(seed)})

        this.act[this.exid] = ""
      },
      hireAdventurer (id) {
        let res = this.search[id].res
        app.ETH.submit("Adventurers", "mint", [res._seed])
      }
    }
  })

}
export {UI}
