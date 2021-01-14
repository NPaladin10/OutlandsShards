import * as OutlandsCore from "../data/outlands.js"
import {UI as uiExplorers} from "./uiExplorers.js"
import {UI as uiStaking} from "./uiStaking.js"
import {UI as uiDaily} from "./uiDailyTreasure.js"

/* 
UI 
*/
const UI = (app)=>{
  //initialize sub UI
  uiExplorers(app)
  uiStaking(app)
  uiDaily(app) 


  let nQ = 0, queue = [], qDone = [];

  /* Format for queue item
    "i+", improvement [id,"i+",where,what,rank,when]
    "mv", unit move [id,"mv",uid,to,when]
    where - shard id 
    what - id of stat 
    rank - new rank of what 
    when - when q is complete
  */

  //handle finishing qhat is in the queue
  let finishQ = (done) => {
    done.forEach(q => {
      let qT = q[1]
      //if improvement
      if(qT == "i+"){
        //improvement [id,"i+",where,what,rank,when]
        //find shard 
        let shard = pack.find(s => s.data.id == q[2]).data
        //increase 
        shard.stats[q[3]]++
        //update UI
        if(app.UI.main.shard && app.UI.main.shard.id == q[2]) {
          Vue.set(app.UI.main,"shard",shard)
        }  
      }
      else if (qT == "mv") {
        //unit move [id,"mv",uid,to,when]
        let unit = units.find(u => u.id == q[2])
        unit.where = q[3]
      }
      //complete
      qDone.push(q)
      let idx = queue.findIndex(_q => _q[0] == q[0])
      queue.splice(idx,1)
      //update
      drawCircleMap(app)
    })
  }

  //creates the VUE js instance
  app.UI.main = new Vue({
    el: '#ui-main',
    data: {
      show: "",
      now: 0,
      tick : 0,
      //eth 
      net: "",
      address : "",
      //admin 
      isAdmin : [],
      //tokens 
      tokens : {},
      allowance: {},
      approval : [],
      //shards
      realms : OutlandsCore.REALMS,
      regions : null,
      shards : null,
      sid: "",
      mayClaim : false,
      mayExplore : false,
      shardCool : 0,
      //store
      store: {},
      //explorers
      explorers : {},
      //match queue
      Q : [],
    },
    mounted() {
      this.now = Math.round(Date.now() / 1000)
      
      setInterval(()=>{
        let _t = ++this.tick
        this.now = Math.round(Date.now() / 1000)

        app.eth.poll()

        //filter out what has been completed
        let done = queue.filter(q => q[q.length-1]<=this.now)
        let remain = queue.filter(q => q[q.length-1]>this.now)

        //update Q 
        this.Q = remain.slice()
        //finish 
        finishQ(done)
      }, 500)

    },
    computed: {
      day() {
        return app.day
      },
      regionArray () {
        return 
      },
      selectedShard () {
        if(this.sid == "") return null

        this.mayClaim = false
        //check claim 
        app.ETH.submit("OutlandsShards", "isClaimedBySeed", [this.sid]).then(res => {
          this.mayClaim = !res && this.tokens[201].val >= 100 
        })

        //check explore 
        this.mayExplore = false
        app.ETH.submit("ExploreShard", "shardTimer", [this.sid]).then(res => {
          let dt = this.shardCool = res.toNumber()

          //shard has to be ready 
          if(this.now > dt) {
            //loop through explorers 
            Object.entries(this.explorers).forEach(e => {
              let ex = e[1]
              if(ex._shardSeed == this.sid && ex._cool < this.now) {
                this.mayExplore = true
              }
            })
          } 
        })

        return  app.ETH.shards[this.sid]
      },
      timeToCool () {
        let dt = this.shardCool - this.now
        return dt > 0 ? app.timeFormat(this.shardCool-this.now) : ""
      }
    },
    methods: {
      reset() {
        app.reset()
      },
      addToQueue () {
        let {id,stats} = this.shard
        let what = this.advId
        let rank = stats[what]+1
        let dT = TIMES[what]
        let when = (dT * Math.pow(2,rank-1))  

        //improvement [id,"i+",where,what,rank,when]
        queue.push([++nQ,"i+",id,what,rank,this.now + when])
        this.Q = queue.slice()
      },
      approveGatekeeper() {
        let eth = app.ETH
        eth.submit("CPXToken1155", "setApprovalForAll", [eth.contracts.Gatekeeper.address, true]).then(res => {
          this.approval.push("Gatekeeper")
        })
      },
      buySKU(id,sku) {
        let data = {id}

        if(id == 0) {
          data.shard = chance.pickone(this.shards).id
        }

        /*
        //buy (id, qty)
        app.ETH.submit("Storefront1155", "buy", [id,1,bytes])
        */
        app.submit("buy", data)
          .then(res => {
            app.simpleNotify("Received "+sku.toBuy)
          })
          .catch(rej => {
            console.log(rej)
          })
      },
      claimShard() {
        //buy id 100, data = (bytes32 seed)
        app.ETH.submit("Storefront1155", "buy", [100, 1, this.sid])
      },
      explore () {
        //filter for the explorer 
        let exid = Object.values(this.explorers).filter(e => e._cool < this.now && e._shardSeed == this.sid)[0].id
        
        app.ETH.submit("ExploreShard", "explore", [exid], {gasLimit:500000})
        this.sid = ""
      }
    }
  })
}

export {UI}
