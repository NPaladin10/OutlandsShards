const UI = (app)=>{

  Vue.component("ui-characters", {
    template: "#ui-characters",
    props: ["actors", "now", "tokens"],
    data: function() {
      return {
        exid: "",
        action: {},
        elementals: [],
        nameId: "",
        name : ""
      }
    },
    mounted() {
      app.UI.characters = this
      this.elementals = app.UI.main.shards.filter(s=>s.elementals).map(s=>s.elementals)
      setInterval(async()=>{
        this.elementals = app.UI.main.shards.filter(s=>s.elementals).map(s=>s.elementals)
      }
      , 5000)

    },
    computed: {
      activeTrouble() {
        return app.UI.main.activeTrouble.slice()
      },
      canTame() {
        return this.tokens["tcb"].val > 0
      }
    },
    methods: {
      setName () {
          //set the name 
          app.characters.setName(this.nameId, this.name)
          this.actors[this.nameId].name = this.name

          //clear
          this.nameId = ""
          this.name = ""
      },
      cool(cool) {
        if (cool < this.now)
          return "Ready"
        return app.timeFormat(cool - this.now)
      },
      async bindElemental(e, actor) {
        //failed attempt
        if (chance.bool()) {
          return app.simpleNotify("Failed to bind the elemental.", "error")
        }

        //call bind 
        let res = await app.characters.bindElemental(app.player, e, actor, ["tcb", 1])
        if (res.success) {
          app.simpleNotify("Bound the elemental!", "success")
          //delete storage
          localStorage.removeItem("ele." + e._home)
          this.elementals = app.UI.main.shards.filter(s=>s.elementals).map(s=>s.elementals)
        }
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
