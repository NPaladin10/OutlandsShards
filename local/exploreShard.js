//generators 
import {ShardGen} from "../gen/shard.js"

//id for db functions
const DBID = "ExploreShards"

const MAYEXPLORE = ["exp"]
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
  "0" : [],
  "1" : [],
  "2" : [],
  "3" : [],
  "4" : [],
  "5" : [],
  "6" : [],
}

//state for save and active data 
const state = {
  shardTimer : {},
  countExploreByShard : {},
  countExploreByExplorer : {}
}

const ID_TIMER = "ESTimer"
const ID_EXBYSHARD = "ESExByShard"
const ID_EXBYEX = "ESExByEx"

const ExploreShards = (app)=>{

  let GK = app.server.gatekeeper
    , C = app.server.characters;

  /*
    cooldown calculation 
    _a : anchor - 1 to 5
    r : rarity - 1 to 5
  */
  const _getCool = (_a, r) => {
    let d4 = chance.d4()
    let risk = ANCHORRISK[_a-1] // anchors are 1-5
    let d8 = r-1+d4

    //cooldown is based on risk, the rarity = size and d4 
    return RISKCOOLDOWN[risk][d8Tod4[d8]];
  }

  /*
    treasure calculation 
    _a : anchor - 1 to 5
    r : rarity - 1 to 5
  */
  const _getReward = (_a, r) => {
    //provides random 'wiggle' of treasure 
    let subTi = chance.pickone(d8Tod4)
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
  }

  /*
    Explore function 
    id - id of explorer
  */
  const explore = (player, id) => {
    let _res = {
      success : false
    }

    //make sure the shard timer is ready 
    
    //make sure they are the owner
    if(player != await GK.getOwner(id)) {
      _res.reason = "You don't own the explorer."
      return _res
    }
    //check if the id may explore 
    let nft = id.split(".")[0]
    if(!MAYEXPLORE.includes(nft)) {
      _res.reason = "This character may not explore."
      return _res
    }
    //check if they may act 
    let mayAct = await C.mayAct(id)
    if(!mayAct) {
      _res.reason = "The explorer cannot act yet."
      return _res
    }

    let shard = await C.getShard(id)
    
  }

}

export {ExploreShards}
