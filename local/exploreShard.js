//generators 
import {ShardGen} from "../gen/shard.js"

/*******************************************************
  
  Constants

*******************************************************/

const MAYEXPLORE = ["adv"]
const QTY = [1,1,1,1,2,2,2,3] // number to be given 
const d8Tod4 = [1,1,2,2,2,3,3,4]
const SHARDCOOLDOWN = 22 * 3600
const RISKCOOLDOWN = [[4,6,10,16],[10,12,16,22],[16,18,22,28],[22,24,28,34]]
const ANCHORRISK = [3,1,0,2,1]
const ANCHORTREASURE = {
  "0" : [0,1,1,0,1,2,2,1,2,3,3,2,3,4,4,3,4,5,5,4],
  "1" : [0,1,1,2,1,2,2,3,2,3,3,4,3,4,4,5,4,5,5,6],
  "2" : [1,1,2,1,2,2,3,2,3,3,4,3,4,4,5,4,5,5,6,5],
  "3" : [2,1,2,1,3,2,3,2,4,3,4,3,5,4,5,4,6,5,6,5]
}
const TREASURE = {
  "0" : [["emd",2],["rby",2],["sph",2],["crt",400],["c1h",1],["c15",4]],
  "1" : [["emd",25],["rby",5],["sph",5],["crt",1000],["c1h",3],["c3h",1]],
  "2" : [["dmd",0.5],["emd",15],["rby",15],["sph",15],["crt",3000],["c3h",4],["c8h",1]],
  "3" : [["dmd",1],["emd",30],["rby",30],["sph",30],["c1d",24],["c8h",3]],
  "4" : [["dmd",2],["emd",60],["rby",60],["sph",60],["c1d",2],["c8h",6]],
  "5" : [["dmd",20]],
  "6" : [["dmd",50]],
}

/*******************************************************
*******************************************************/
//STAT ID 
const ID_EXCOOL = "ecl"
//state for save and active data 
const ID_COUNTS = "ESCount"

const ExploreShards = (app)=>{

  let GK = app.server.gatekeeper
    , C = app.server.characters;

  const _mayExplore = async (id) => {
    let nft = id.split(".")[0]
    return MAYEXPLORE.includes(nft)
  }

  const getExCool = async (id) => {
    let cool = await GK.getStats(id, [ID_EXCOOL]) || [0]
    return cool[0]
  }

  /*
    cooldown calculation 
    _a : anchor - 1 to 5
    r : rarity - 1 to 5
  */
  const _getCool = (_a, r) => {
    let d4 = chance.d4()-1
    let risk = ANCHORRISK[_a-1] // anchors are 1-5
    let d8 = r-1+d4

    //cooldown is based on risk, the rarity = size and d4 
    return RISKCOOLDOWN[risk][d8Tod4[d8]-1];
  }

  /*
    treasure calculation 
    _a : anchor - 1 to 5
    r : rarity - 1 to 5
  */
  const _getReward = (_a, r) => {
    //provides random 'wiggle' of treasure 
    let subTi = chance.pickone(d8Tod4)-1
    //treasure scales up based upon rarity
    let ati = 5*(r-1) + subTi;

    //anchor treasure  
    let risk = ANCHORRISK[_a-1]
    let _t = ANCHORTREASURE[risk][ati]
        
    //generate a treasure
    let n = chance.pickone(QTY)
    let T = Array.from({length : n}, (v,j) => {
      return chance.pickone(TREASURE[_t])
    })

    return T
  }

  /*
    Explore function 
    id - id of explorer
  */
  const explore = async (player, id) => {
    let _res = {
      success : false
    }

    //make sure the shard timer is ready 
    let shard = await C.getShard(id)
    let sT = await getExCool(shard.id)
    if(sT > app.now) {
      _res.reason = "Shard cannot be explored yet."
      return _res 
    }
    //make sure they are the owner
    if(player != await GK.getOwner(id)) {
      _res.reason = "You don't own the explorer."
      return _res
    }
    //check if the id may explore 
    let mayExplore = await _mayExplore(id)
    if(!mayExplore) {
      _res.reason = "This character may not explore."
      return _res
    }
    //check if they may act 
    let mayAct = await C.mayAct(id)
    if(!mayAct) {
      _res.reason = "The explorer cannot act yet."
      return _res
    }

    //set timer 
    await GK.setStats(shard.id, [ID_EXCOOL], [app.now + SHARDCOOLDOWN])

    //load and set counts 
    let {byShard = {}, byEx = {}} = await app.DB.getItem(ID_COUNTS) || {}
    byShard[shard.id] = byShard[shard.id] ? byShard[shard.id]+1 : 1
    byEx[id] = byEx[id] ? byEx[id]+1 : 1 
    app.DB.setItem(ID_COUNTS, {byShard,byEx}) 

    //now explore 
    let coolT = _getCool(shard.anchor.id, shard.anchor.rarity)*3600
    //set character cool
    C.setCool(id, app.now+coolT)

    //get explore treasure
    let reward = _getReward(shard.anchor.id, shard.anchor.rarity) 
    GK.mint(player, reward)

    return {
      success : true,
      data : {
        cool : coolT/3600,
        T : reward
      }
    } 
  }

  //server
  app.server.explore = { exploreShard : explore, getExCool }

  /*
    Calls 
  */

  app.server.calls.exploreShard = async (call) => {
    let {id} = call.data
    //validate ownership 
    if(call.player != await GK.getOwner(id)) {
      return {
        success : false,
        reason: "Do not own the character."
      }
    }

    return explore(call.player, id)
  }
  app.server.calls.getExCool = async (call) => {
    let {id} = call.data
    return {
      success : true,
      data : await getExCool(id)
    }
  }

}

export {ExploreShards}
