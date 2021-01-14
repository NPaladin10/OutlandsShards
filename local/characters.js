import {TOKENS, NFT} from "../data/tokenlist.js"

//generators 
import {ShardGen} from "../gen/shard.js"

const Characters = (app)=>{
  //STAT ID 
  //const ID_EID = 0, ID_OWNER = 1;
  const ID_HOME = 2, ID_LOCATION = 3, ID_COOL = 4, ID_XP = 5;

  let GK = app.server.gatekeeper

  /*
    server functions 
  */

  const getCool = async (id)=>{
    let cool = await GK.getStats(id, [ID_COOL])
    return cool[0]
  }

  const mayAct = async (id) => {
    let cool = await GK.getStats(id, [ID_COOL])
    return cool[0] < app.now 
  }

  const setCool = (id,cool)=>{
    //set location and cool 
    GK.setStats(id, [ID_COOL], [cool])
  }

  const getShard = async (id) => {
    let sid = await GK.getStats(id, [ID_LOCATION])
    return ShardGen(app, sid.split("."))
  }

  //reduces cooldown of a character 
  const reduceCooldown = async (player, data)=>{
    let {id, coolId, qty} = data

    //prepare result
    let _res = {
      success : false 
    }

    if(!TOKENS[coolId] || !TOKENS[coolId].cool){
      //failure
      _res.reason = "Token is incorrect."
      return _res
    }
    //burn - check result
    let burn = await GK.burn(player, [[coolId, qty]])
    if(!burn) {
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
      success : true,
      data : nT
    }
  }

  //basic move - requires cool 
  const move = async (id,toShard)=>{
    let statIds = [ID_LOCATION, ID_COOL]
    let stats = await GK.getAllStats(id) 

    if (stats[ID_COOL] > app.now) {
      return {
        success : false,
        reason : "Still on cooldown."
      }
    }

    let fromShard = stats[ID_LOCATION]
      , time = travelTime(fromShard, toShard)
      , cool = app.now + time;

    //set location and cool 
    GK.setStats(id, statIds, [toShard, cool])

    return {
      success : true,
      data : cool
    }
  }

  //free move - no cool 
  const moveFree = (id,toShard)=>{
    //set current location
    GK.setStats(id, [ID_LOCATION], [toShard])
  }

  const mint = async (player, data)=>{
    let {nft, shard, seed=chance.hash({
      length: 10
    })} = data 

    let _id = nft + "." + seed

    //check if exists
    let exists = await GK.nftExists(_id)
    if(exists) {
      //failure 
      return {
        success : false,
        reason : "Character exists."
      }
    }
    else {
      //mint - mintNFT = (nft, id) 
      //must wait for return because Stat DB is open on mint 
      await GK.mintNFT(player, nft, _id)
      //set stats 
      GK.setStats(_id, [ID_HOME, ID_LOCATION, ID_COOL, ID_XP], [shard, shard, 0, 0])

      return {
          success : true,
          data : {id:_id} 
      }  
    }
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

  app.server.calls.getCharacterData = async (call) => {
    return {
      success : true,
      data : await GK.getAllStats(call.data.id)
    }
  }
  app.server.calls.characterMove = async (call) => {
    let {id, to} = call.data
    //validate ownership 
    if(call.player != await GK.getOwner(id)) {
      return {
        success : false,
        reason: "Do not own the character."
      }
    }

    return move(id, to)
  } 
  app.server.calls.characterReduceCooldown = (call) => {
    return reduceCooldown(call.player, call.data)
  }

  /*
    app level functions 
  */
  const travelTime = (from, to) => {
    //travelTimes : [2,8,22]
    let times = app.params.travelTimes

    let fromRealm = ShardGen(app, from.split("."))._realm
      , toRealm =  ShardGen(app, to.split("."))._realm;
    
    if(fromRealm == toRealm) return times[1]
    else return times[2]
  }

  app.characters = {
    travelTime
  }
}

export {Characters}
