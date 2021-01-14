import {formatTokenText} from "../data/tokenlist.js"
//treasure
import {FREETREASURE} from "../data/sku.js"

const UI = (app)=>{

  Vue.component("ui-daily", {
    template: "#ui-daily",
    props: ["now"],
    data: function() {
      return {
        period : ["10 minutes","4 hours","Daily"],
        periodTimes : [10*60,4*3600,22*3600],
        lastClaim : [0,0,0],
        free : FREETREASURE,
        hasClaimed : []
      }
    },
    mounted() {
      app.UI.dailyTreasure = this
      this.lastClaim = [this.now,this.now,this.now]
      this.checkClaims()
    },
    computed : {
      hasFree () {
        //see if free treasure is available
        return Object.entries(this.free).reduce((_free, e, i) => {
          if(_free) return _free
          if(e[1].until > this.now && !this.hasClaimed.includes(e[0])) _free = true 
          return _free
        },false)
      },
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
      formatTokenText(list) {
        return formatTokenText(list)
      },
      checkClaims () {
        app.submit("dailyClaims").then(res => {
          //update UI
          this.lastClaim = res.data.lastMint.slice()
          this.hasClaimed = res.data.hasClaimed.slice()
        })  
      },
      claimFree (id) {
        app.submit("claimFreeTreasure", {id}).then(res => {
          //format and notify
          formatTokenText(res.data.T).forEach(t => {
            //notify
            app.simpleNotify("Received "+t)
          })

          //update times 
          this.hasClaimed = res.data.hasClaimed.slice()
        })
      },
      claim(i) {
        app.submit("dailyTreasureMint", {i}).then(res => {
          //format and notify
          formatTokenText(res.data.T).forEach(t => {
            //notify
            app.simpleNotify("Received "+t)
          })

          //update times 
          this.lastClaim = res.data.lastMint.slice()
        })
      }
    }
  })
}

export {UI}

/*
        let eth = app.ETH
          , T1155 = eth.contracts.CPXToken1155.address
          , gasLimit = 250000; //override gas limit

        eth.submit("DailyTreasure", "getDailyTreasure", [i], {gasLimit}).then(res => {
          //set time 
          Vue.set(this.lastClaim, i, this.now-3)
        })
        */