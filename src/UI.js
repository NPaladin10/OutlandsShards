import * as OutlandsCore from "./outlands.js"
import {UI as uiExplorers} from "./uiExplorers.js"
import {UI as uiStaking} from "./uiStaking.js"

/* 
UI 
*/
const UI = (app)=>{
  //initialize sub UI
  uiExplorers(app)
  uiStaking(app) 


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

        app.ETH.poll()

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
        //buy (id, qty)
        app.ETH.submit("Storefront1155", "buy", [id,1])
      }
    }
  })
}

export {UI}
