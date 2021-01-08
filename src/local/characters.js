import {TOKENS} from "./tokenlist.js"

const ADVENTURERSKILLS = ["Academic","Diplomat","Explorer","Engineer","Rogue","Soldier"]

const poll = (app)=>{
  let GK = app.gatekeeper
    , UI = app.UI.main;

  const pollExplorer = (id) => {
    let data = app.characters.getData(id)
      , seed = data[3]
      , _shard = app.shardFromSeed(seed)
      , _cool = data[4];

    let e = {
      id,
      _shard,
      shard: _shard ? _shard.regionName + ", " + _shard.seed : null,
      _shardSeed: seed, 
      _cool,
      _act : ""
    }

    //set UI 
    Vue.set(UI.explorers, id, e)
  }

  const pollAllExplorers = () => {
    let n = GK.countOfNFT[10**6] || 0 
    for(let i = 0; i < n; i++){
      pollExplorer(10**6+i+1)
    }
  }

  let tick = 0
  return ()=>{
    tick++

    if(tick % 4 == 0) pollAllExplorers()
  }
}

const Characters = (app) => {
  const ID_NFT = 0
    , ID_SEED = 1
    , ID_HOME = 2
    , ID_LOCATION = 3
    , ID_COOL = 4;

  const NFTID = 10**6;

  let GK = app.gatekeeper
    , hexToNumber = app.utils.hexToNumber;

  const getData = (id) => {
    return GK.getStats(id, [ID_NFT, ID_SEED, ID_HOME, ID_LOCATION, ID_COOL])
  }

  const getCool = (id) => {
    return GK.getStats(id, [ID_COOL])[0]
  }

  const setCool = (id, cool) => {
    //set location and cool 
    GK.setStats(id, [ID_COOL], [cool])
  }

  //reduces cooldown of a character 
  const reduceCooldown = (id, coolId, qty) => {
    //only tokens with cool 
    if(TOKENS[coolId].cool) {
      //check for successful burn
      if(GK.burn([[coolId, qty]])) {
        let cool = TOKENS[coolId].cool * qty
          , nT = getCool(id) - cool;

        setCool(id, nT)

        return true
      }
    }
    return false 
  }

  //basic move - requires cool 
  const move = (id, toShard) => {
    if(GK.getStats(id,[ID_COOL]) > app.now) {
      app.simpleNotify("Still on cooldown.", "error")
      return false
    }

    let fromShard = GK.getStats(id,[ID_LOCATION])[0]
      , time = app.travelTime(fromShard, toShard)*3600
      , cool = app.now+time; 
    
    //set location and cool 
    GK.setStats(id, [ID_LOCATION, ID_COOL], [toShard, cool])

    return true
  } 

  //free move - no cool 
  const moveFree = (id, toShard) => {
    //set current location
    GK.setStats(id,[ID_LOCATION],[toShard])
  }

  const mint = (data) => {
    let {shard} = data
    //mint 
    let id = GK.mintNFT(NFTID)
    //set stats 
    GK.setStats(id, [ID_SEED, ID_HOME, ID_LOCATION, ID_COOL], ["", shard, shard, 0])
  }

  //set functions for external use  

  app.characters = {mint, moveFree, move, getData, setCool, poll: poll(app)}
  app.server.characterMove = move
  app.server.characterReduceCooldown = reduceCooldown

  /*
    app level functions 
  */

  app.travelTime = (from, to) => {
    let regions = app.regions.all
      , times = [22,8,2];

    let fromShard = app.shardFromSeed(from)
      , toShard = app.shardFromSeed(to);

    let fromRegion = fromShard.region,
      toRegion = toShard.region,
      fromRealm = regions[fromRegion].realm,
      toRealm = regions[toRegion].realm; 
    
    let time = times[0]
    if(fromRegion == toRegion) time = times[2]
    else if (fromRealm == toRealm) time = times[1]
    
    return time
  }

  app.adventurerFromSeed = (seed) => {
    const _d6 = (i) => {
      return 1 + (hexToNumber(seed,i,i+1) % 6)
    } 

    //skill 
    let skills = [0,0,0]
    skills[0] = _d6(0) 
    if(hexToNumber(seed,1,2)%16 == 0){
      //two skills
      skills[1] = _d6(2)

      //three skills  
      if(hexToNumber(seed,3,4)%64 == 0){
        skills[2] = _d6(4)
      }
    }

    //text
    let text = skills.filter(id => id>0).map(id => ADVENTURERSKILLS[id-1])
    
    //data formatting 
    return {
      _seed : seed,
      skills : {
        ids : skills,
        text
      },
      cost : Math.pow(10,-2+text.length)
    }
  }
}

export {Characters}