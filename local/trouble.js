//generators 
import {TroubleGen} from "../gen/trouble.js"
import {AdventurerGen} from "../gen/adventurer.js"

/*******************************************************
  
  Constants

*******************************************************/

// SAFETY = ["safe","unsafe","dangerous","perilous"]
const ADVENTURERSKILLS = ["Academic", "Diplomat", "Explorer", "Engineer", "Rogue", "Soldier"]
//TREASURE
const QTY = [1, 1, 1, 1, 2, 2, 2, 3]
// number to be given 
const TREASURE = {
  "1": [["emd", 5], ["rby", 5], ["sph", 5], ["crt", 1000], ["c1h", 3], ["c3h", 1]],
  "2": [["dmd", 0.5], ["emd", 15], ["rby", 15], ["sph", 15], ["crt", 3000], ["c3h", 4], ["c8h", 1]],
  "3": [["dmd", 1], ["emd", 30], ["rby", 30], ["sph", 30], ["c1d", 24], ["c8h", 3]],
  "4": [["dmd", 2], ["emd", 60], ["rby", 60], ["sph", 60], ["c1d", 2], ["c8h", 6]],
  "5": [["dmd", 20]],
}

/*******************************************************
  Character STATS 
*******************************************************/

//STAT ID 
const ID_LOCATION = "loc"
  , ID_HOME = "hme"
  , ID_COOL = "col";

/*******************************************************
  Database links 
*******************************************************/

const DB_INWORK = localforage.createInstance({
  name: "Shards",
  storeName: "Trouble"
})
const DB_SOLVED = localforage.createInstance({
  name: "Shards",
  storeName: "TroubleSolved"
})

/*******************************************************
*******************************************************/

const SolveTrouble = (app)=>{

  let {hexToNumber, hash} = app.utils

  let GK = app.server.gatekeeper
    , C = app.server.characters;

  //determine treasure
  const _getTreasure = (shard,trouble)=>{
    //generate a treasure
    let n = chance.pickone(QTY)
    return Array.from({
      length: n
    }, (v,j)=>{
      return chance.pickone(TREASURE[trouble.rank])
    }
    )
  }

  //solved id for a trouble - based upon shard and day 
  const _solvedId = (shard)=>{
    let day = Math.floor(app.now / 3600 / 24)
    return "tbl." + shard.id.split(".").slice(1).join(".") + "." + day
  }

  const _getSolved = async()=>{
    return await DB_SOLVED.keys() || []
  }

  const isSolved = async (id) => {
    return await DB_SOLVED.getItem(id) || false
  }

  //VIEWS
  const solvedBy = async(id)=>{
    return ""
  }

  //pull all opposition 
  const allActiveTrouble = async()=>{
    let ids = await DB_INWORK.keys()
    let o = [], opp;
    for (let i = 0; i < ids.length; i++) {
      opp = await DB_INWORK.getItem(ids[i])
      opp.id = ids[i]
      o.push(opp)
    }
    return o
  }

  // OPPOSE - first step - assign adventurers to oppose  

  //commit actors to engage a trouble 
  const oppose = async(player,actors)=>{
    let sid = _solvedId(actors[0].shard)
      , solved = await _getSolved()
      , _solvedBy = await solvedBy(sid);

    //check if solved 
    if (_solvedBy != "" || solved.includes(sid)) {
      return {
        success: false,
        reason: "Already solved."
      }
    }
    //check if engaged already 
    if (await DB_INWORK.getItem(sid)) {
      return {
        success: false,
        reason: "Already engaged."
      }
    }

    //initialize engagement 
    let e = {
      _act: actors.map(a=>a.id),
      dmg: actors.map(a=>0),
      xp: false,
      step: 0
    }

    //set in db 
    DB_INWORK.setItem(sid, e)

    //success
    return {
      success: true,
      data: e
    }
  }

  //OPPOSE - take steps to complete 
  const challenge = async(player,T,lead,spt)=>{
    //check if solved 
    if (await solvedBy(T.id) != "") {
      return {
        success: false,
        reason: "Already solved."
      }
    }

    //core data for save 
    let _T = T._data

    //skill and lead skill val 
    let skill = T._c[T.step]
    let b = spt ? 1 : 0
    let sVal = lead._skills[skill] + b || b

    //ROLL
    let roll = app.roll.blades(sVal)
    //check for damage 
    if (roll.res < 1) {
      let ai = T._act.indexOf(lead.id)

      //take damage - based upon danger of shard and rank of trouble 
      // safety 0-3 : rank 1-5
      let dmg = T.rank > lead.shard._safety ? T.rank : lead.shard._safety
      _T.dmg[ai] += dmg
      //take damage in support 
      if (spt)
        _T.dmg[T._act.indexOf(spt.id)] += Math.round(dmg / 2)

      //set xp trigger 
      _T.xp = true
    }

    //check for success 
    if (roll.res > -1) {
      //step 
      _T.step++
    }

    //complete 
    if (_T.step >= T._c.length) {
      let reward = _getTreasure(T.shard, T)
      //mint 
      GK.mint(player, reward)

      //cooldown - damage determines cool 
      _T._act.forEach((id,i)=>{
        if (_T.dmg[i] > 0) {
          //one hour per damage
          let cool = app.now + _T.dmg[i] * 5 * 3600
          C.setCool(id, cool)
        }
      }
      )

      //delete 
      DB_INWORK.removeItem(T.id)
      //solve 
      DB_SOLVED.setItem(T.id, true)

      //success
      return {
        success: true,
        data: {
          step : _T.step,
          cool: _T.dmg.map(v=>v * 5),
          T: reward
        }
      }
    } else {
      //save state 
      DB_INWORK.setItem(T.id, _T)

      return {
        success: true,
        data: _T
      }
    }
  }

  //RETREAT

  //sometimes you just need to retreat
  const retreat = async(player, T)=>{
    let _T = T._data

    //cooldown - damage determines cool 
    _T._act.forEach((id,i)=>{
      if (_T.dmg[i] > 0) {
        //five hours per damage
        let cool = app.now + _T.dmg[i] * 5 * 3600
        C.setCool(id, cool)
      }
    }
    )

    //delete 
    DB_INWORK.removeItem(T.id)

    return {
        success: true,
        data: _T.dmg.map(v => v*5)
      }
  }

  app.trouble = {
    oppose,
    challenge,
    retreat,
    allActiveTrouble,
    allSolved : _getSolved,
    isSolved 
  }

}

export {SolveTrouble}
