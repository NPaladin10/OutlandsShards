const UI = (app)=>{

  Vue.component("ui-characters", {
    template: "#ui-characters",
    props: ["actors", "now", "tokens"],
    data: function() {
      return {
        exid: "",
        action: {},
        newHires : []
      }
    },
    mounted() {
      app.UI.characters = this
      this.newHires = app.UI.main.shards.filter(s => s.advForHire).map(s => s.advForHire)
      setInterval(async ()=>{
        this.newHires = app.UI.main.shards.filter(s => s.advForHire).map(s => s.advForHire)
      }, 5000)
    },
    computed: {},
    methods: {
      cool(cool) {
        if (cool < this.now)
          return "Ready"
        return app.timeFormat(cool - this.now)
      },
      hireAdventurer(adv) {
        //data from saved adventurer
        let data = {
          id: adv.id,
          _home: adv._home
        }
        
        //submit
        app.submit("hireAdventurer", data).then(res=>{
          app.simpleNotify("Hired " + adv.skills.text)
          //delete storage
          localStorage.removeItem("adv." + adv._home)
          this.newHires = app.UI.main.shards.filter(s => s.advForHire).map(s => s.advForHire)
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
