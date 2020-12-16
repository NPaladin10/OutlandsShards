const UI = (app)=>{
  const cIds = [101,102,103,104,105,106]

  Vue.component("ui-explorers", {
    template: "#ui-explorers",
    props : ["explorers","now","tokens"],
    data: function() {
      return {
        exid : "",
        act : -1,
        shards : [],
        moveTo : -1,
        optsReduceCool : {
          id: "",
          qty : 0,
        }
      }
    },
    mounted() {
      this.shards = app.ETH.shardArray.slice()

      setInterval(()=>{
        this.shards = app.ETH.shardArray.slice()
      },5000)
    },
    computed: {
      moveTime () {
        let from = this.explorers[this.exid]._shard._seed
        return this.moveTo > -1 ? app.ETH.travelTime(from, this.moveTo) : 0  
      },
      cooldown () {
        return Object.entries(this.tokens).filter(t => cIds.includes(Number(t[0])))
      },
      actOpts () {
        let actions = ["Move"]

        if(this.cooldown.length>0) actions.push("Reduce Cooldown")

        return actions
      }
    },
    methods: {
      cool (cool) {
        if(cool < this.now) return "Ready"
        
        let ts = cool - this.now,
          hrs = Math.floor(ts / 3600),
          min = Math.floor((ts-(hrs*3600))/60),
          s = ts-hrs*3600-min*60;
        
        return hrs + " h "+min+" m "+s+" s"    
      },
      initLoc(id) {
        app.ETH.submit("CharacterLocation", "init", [id])
      },
      move () {
        app.ETH.submit("CharacterLocation", "move", [this.exid, this.moveTo])
      },
      reduceCool()
      {
        let {id, qty} = this.optsReduceCool
        let ti = cIds.indexOf(Number(id))
        //useCooldownToken (uint256 _id, uint256 _ti, uint256 _qty)
        app.ETH.submit("Cooldown", "useCooldownToken", [this.exid, ti, qty])
      }
    }
  })

}
export {UI}
