import {TREASURE} from "./treasurelist.js"

const DailyTreasure = (app) => {
  let TM = app.treasure
    , notify = app.simpleNotify;

  const _lastMint = [0,0,0]
    , _mintPeriods = [10*60, 4*3600, 22*3600];
  
  
  
  const mint = (i) => {
    if(_lastMint[i] > app.now) {
      notify("Wait time not elapsed.", "error")
      return false 
    }
  }
}

const TreasureMinter = (app) => {

  let GK = app.gatekeeper

  const mint = (ids) => {
    //create a list of treasure [id, val] from treasure ids 
    const _t = ids.map(id => TREASURE[id])
    //mint 
    GK.mint(_t)
  }

  app.treasure = {mint}
}

export {TreasureMinter}