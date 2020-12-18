const UI = (app)=>{

  Vue.component("ui-daily", {
    template: "#ui-daily",
    props: ["now"],
    data: function() {
      return {
        period : ["Daily","4 hours","10 minutes"],
        periodTimes : [22*3600,4*3600,10*60],
        lastClaim : [0,0,0],
      }
    },
    mounted() {
      app.UI.dailyTreasure = this
      this.lastClaim = [this.now,this.now,this.now]
      //update 
      app.ETH.dailyTreasureTime()
    },
    computed : {
      timeRemaining () {
        let pT = this.periodTimes

        return this.lastClaim.map((t,i) => {
          let dT = this.now-t 

          return dT > pT[i] ? 0 : pT[i]-dT 
        })
      },
      formatTime () {
        return this.timeRemaining.map(app.timeFormat)
      }
    },
    methods : {
      claim(i) {
        let eth = app.ETH
          , T1155 = eth.contracts.CPXToken1155.address
          , gasLimit = 250000; //override gas limit

        eth.submit("DailyTreasure", "getDailyTreasure", [i], {gasLimit}).then(res => {
          //set time 
          Vue.set(this.lastClaim, i, this.now-3)
        })
      }
    }
  })
}

export {UI}
