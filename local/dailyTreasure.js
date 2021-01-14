import {PERIODS, TREASURE, QTY, FREE} from "../data/dailyTreasure.js"

const DB = localforage.createInstance({
  name: "Shards",
    storeName: "DailyTreasure"
})

const DailyTreasure = (app)=>{
  //quick reference links 
  let GK = app.server.gatekeeper

  const free = async (player, i) => {
    let {hasClaimed = [], lastMint = [0,0,0]} = await DB.getItem(player) || {}

    let _res = {
      success : false
    }
    // does it exist 
    if (!FREE[i]) {
      //return failure
      _res.reason = "Treasure does not exist."
      return _res
    }
    //already claimed  
    if (hasClaimed.includes(i)) {
      //return failure
      _res.reason = "Already claimed."
      return _res
    }
    //out of claim period
    if(app.now > FREE[i].until){
      //return failure
      _res.reason = "Past claim period."
      return _res
    }

    //claim 
    hasClaimed.push(i)
    //save 
    DB.setItem(player, { hasClaimed, lastMint })

    //passed tests now claim
    let T = []
    if(FREE[i].all) {
      //take all
      T = FREE[i].T.slice()
    }
    else {
      //random quantity
      let n = chance.pickone(QTY)
      T = Array.from({length : n}, (v,j) => {
        return chance.pickone(FREE[i].T)
      })
    }

    //mint 
    GK.mint(player, T)

    //success
    return {
      success : true,
      data : {
        T,
        hasClaimed
      } 
    }
  }

  const mint = async (player, i)=>{
    let {hasClaimed = [], lastMint = [0,0,0]} = await DB.getItem(player) || {}

    let _res = {
      success : false
    }

    // have to wait sufficient time 
    if (lastMint[i] > app.now) {
      //return failure
      _res.reason = "You have not waited long enough."
      return _res
    }
    //insure id is correct
    if (i > 2) {
      //return failure
      _res.reason = "ID is incorrect."
      return _res
    }
    
    //update lastMint
    lastMint[i] = app.now 
    DB.setItem(player, {hasClaimed, lastMint})

    //use chance to pick number and treasure 
    let n = chance.pickone(QTY)
    let T = Array.from({length : n}, (v,j) => {
      return chance.pickone(TREASURE[i])
    })

    //mint 
    GK.mint(player, T)

    //success
    return {
      success : true, 
      data: {
        T,
        lastMint
      }
    }
  }

  //poll - saves state 
  const poll = () => {
  }

  /*
    Server functions 
  */

  app.server.dailyTreasure = {poll}

  /*
    calls 
  */

  app.server.calls.dailyTreasureMint = (call) => {
    return mint(call.player, call.data.i)
  }
  app.server.calls.claimFreeTreasure = (call) => {
    return free(call.player, call.data.id)
  }
  app.server.calls.dailyClaims = async (call) => {
    return {
      success : true,
      data : await DB.getItem(call.player)
    }
  }
}

export {DailyTreasure}
