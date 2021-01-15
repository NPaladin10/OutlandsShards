import {TOKENS, NFT} from "../data/tokenlist.js"

//generators 
import {ShardGen} from "../gen/shard.js"
import {AdventurerGen} from "../gen/adventurer.js"

//const ANCHORS = ["Lair","Terrain","Town","Ruin","Site"], comes as 1-5
const NFTADV = "adv"
const ADVVERSION = 1
const ADVSEARCHCOOL = {
  "2" : [22,16,12,10],
  "3" : [16,10,6,4],
  "5" : [22,16,12,10]
}

//STAT ID 
//const ID_EID = 0, ID_OWNER = 1;
const ID_HOME = 2
  , ID_LOCATION = 3
  , ID_COOL = 4
  , ID_XP = 5;

const Characters = (app)=>{

  let GK = app.server.gatekeeper

  /*
    server functions 
  */

  const getCool = async(id)=>{
    let cool = await GK.getStats(id, [ID_COOL])
    return cool[0]
  }

  const mayAct = async(id)=>{
    let cool = await GK.getStats(id, [ID_COOL])
    return cool[0] < app.now
  }

  const setCool = (id,cool)=>{
    //set location and cool 
    GK.setStats(id, [ID_COOL], [cool])
  }

  const getShard = async(id)=>{
    let sid = await GK.getStats(id, [ID_LOCATION])
    return ShardGen(app, sid[0].split("."))
  }

  //reduces cooldown of a character 
  const reduceCooldown = async(player,data)=>{
    let {id, coolId, qty} = data

    //prepare result
    let _res = {
      success: false
    }

    if (!TOKENS[coolId] || !TOKENS[coolId].cool) {
      //failure
      _res.reason = "Token is incorrect."
      return _res
    }
    //burn - check result
    let burn = await GK.burn(player, [[coolId, qty]])
    if (!burn) {
      //failure
      _res.reason = "Not enough tokens."
      return _res
    }

    //determine new cool 
    let reduceBy = TOKENS[coolId].cool * Number(qty)
      , _cool = await getCool(id)
      , nT = _cool - reduceBy;

    //set 
    setCool(id, nT)

    //success
    return {
      success: true,
      data: nT
    }
  }

  //basic move - requires cool 
  const move = async(id,toShard)=>{
    let statIds = [ID_LOCATION, ID_COOL]
    let stats = await GK.getAllStats(id)

    if (stats[ID_COOL] > app.now) {
      return {
        success: false,
        reason: "Still on cooldown."
      }
    }

    let fromShard = stats[ID_LOCATION]
      , time = travelTime(fromShard, toShard)
      , cool = app.now + time;

    //set location and cool 
    GK.setStats(id, statIds, [toShard, cool])

    return {
      success: true,
      data: cool
    }
  }

  //free move - no cool 
  const moveFree = (id,toShard)=>{
    //set current location
    GK.setStats(id, [ID_LOCATION], [toShard])
  }

  /*
    Core mint function 
  */

  const mint = async(player,data)=>{
    let {nft, shard, seed=chance.hash({
      length: 10
    })} = data

    let _id = nft + "." + seed

    //check if exists
    let exists = await GK.nftExists(_id)
    if (exists) {
      //failure 
      return {
        success: false,
        reason: "Character exists."
      }
    } else {
      //mint - mintNFT = (nft, id) 
      //must wait for return because Stat DB is open on mint 
      await GK.mintNFT(player, nft, _id)
      //set stats 
      GK.setStats(_id, [ID_HOME, ID_LOCATION, ID_COOL, ID_XP], [shard, shard, 0, 0])

      return {
        success: true,
        data: {
          id: _id
        }
      }
    }
  }

  /*
    Adventurers 
  */
  const _maySearch = async (id, shard) => {
    //check for player cool
    let _mayAct = await mayAct(id)
    if(!_mayAct) {
      return "Character must wait."
    }
    //check if allowable anchor 
    let allowAnchors = ADVSEARCHCOOL[shard.anchor.id] ? true : false
    if(!allowAnchors){
      return "Cannot find any adventurers on this shard."
    }

    return ""
  }

  const searchForAdventurers = async (id) => {
    //get shard data 
    let shard = await getShard(id)

    //check for allowance 
    let reason = await _maySearch(id, shard)
    if(reason != ""){
      return {
        success : false,
        reason
      }
    }

    //random cool
    let {d8Tod4} = app.params
    let d4 = chance.d4() - 1 // 0-3

    //determine cool - in hours 
    let coolArray = ADVSEARCHCOOL[shard.anchor.id]
    let {rarity} = shard.anchor //1-5
    let cool = coolArray[d8Tod4[d4+rarity-1] - 1] * 3600
    //set cool 
    setCool(id, app.now+cool)

    //id to tell player the exact adventurer
    let seed = chance.hash({
      length: 10
    })

    return {
      success : true,
      data : {
        id : [NFTADV,ADVVERSION,seed].join("."),
        cool : cool/3600
      }
    }
  }

  const hireAdventurer = async (player, data) => {
    let _adv = AdventurerGen(app, data) 
    let {id, _home, cost} = _adv
    let _id = id.split(".")

    //burn cost 
    let burn = await GK.burn(player, [["dmd",cost]])
    if(!burn) {
      return {
        success : false,
        reason : "Not enough tokens."
      }
    }

    //mint
    let mintData = {
      nft : _id.slice(0,2).join("."),
      shard : _home, 
      seed : _id[2]
    }
    return mint(player, mintData)
  }

  //set functions for external use  

  app.server.characters = {
    mint,
    moveFree,
    move,
    setCool,
    mayAct,
    getShard
  }

  /*
    server calls 
  */

  app.server.calls.getCharacterData = async(call)=>{
    return {
      success: true,
      data: await GK.getAllStats(call.data.id)
    }
  }
  app.server.calls.characterMove = async(call)=>{
    let {id, to} = call.data
    //validate ownership 
    if (call.player != await GK.getOwner(id)) {
      return {
        success: false,
        reason: "Do not own the character."
      }
    }

    return move(id, to)
  }
  app.server.calls.hireAdventurer = async(call)=>{
    return {
      success: true,
      data: await hireAdventurer(call.player, call.data)
    }
  }
  app.server.calls.searchForAdventurers = async(call)=>{
    let {id} = call.data
    //validate ownership 
    if (call.player != await GK.getOwner(id)) {
      return {
        success: false,
        reason: "Do not own the character."
      }
    }

    return searchForAdventurers(id)
  }
  app.server.calls.characterReduceCooldown = (call)=>{
    return reduceCooldown(call.player, call.data)
  }

  /*
    app level functions 
  */
  const travelTime = (from,to)=>{
    //travelTimes : [2,8,22]
    let times = app.params.travelTimes

    let fromRealm = ShardGen(app, from.split("."))._realm
      , toRealm = ShardGen(app, to.split("."))._realm;

    if (fromRealm == toRealm)
      return times[1]
    else
      return times[2]
  }

  app.characters = {
    travelTime
  }
}

export {Characters}
