const UI = (app)=>{
  const cIds = [101,102,103,104,105,106]

  Vue.component("ui-explorers", {
    template: "#ui-explorers",
    props : ["explorers","now","tokens"],
    data: function() {
      return {
        exid : "",
        act : {},
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
        this.shards = app.ETH.shardArray.slice().sort(function(a, b){
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
        return this.moveTo > -1 ? app.ETH.travelTime(from, this.moveTo) : 0  
      },
      cooldown () {
        return Object.entries(this.tokens).filter(t => cIds.includes(Number(t[0])))
      },
      actOpts () {
        let actions = ["Move", "Explore"]

        if(this.cooldown.length>0) actions.push("Reduce Cooldown")

        return actions
      }
    },
    methods: {
      cool (cool) {
        if(cool < this.now) return "Ready"
        return app.timeFormat(cool - this.now)    
      },
      initLoc() {
        app.ETH.submit("CharacterLocation", "init", [this.exid, this.moveTo])
        this.act = -1
      },
      move () {
        //initial move 
        if(this.act == "initLoc") return this.initLoc()

        app.ETH.submit("CharacterLocation", "move", [this.exid, this.moveTo])
        this.act = -1
      },
      reduceCool()
      {
        let {id, qty} = this.optsReduceCool
        let ti = cIds.indexOf(Number(id))
        //useCooldownToken (uint256 _id, uint256 _ti, uint256 _qty)
        app.ETH.submit("Cooldown", "useCooldownToken", [this.exid, ti, qty])
        this.act = -1
      },
      explore () {
        let gasLimit = 500000; //override gas limit
        app.ETH.submit("ExploreShard", "explore", [this.exid], {gasLimit}).then(res => {
          console.log(res)
        })
        this.act = -1
      }
    }
  })

}
export {UI}
