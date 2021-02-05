//token data 
import {TOKENS} from "../data/tokenlist.js"

const ID_OWNER = "own" 
  , ID_NAME = "nme"  
  , ID_HOME = "hme"
  , ID_LOCATION = "loc"
  , ID_TRAINER = "trn"
  , ID_COOL = "col"
  , ID_XP = "cxp"
  , ID_EXCOOL = "ecl";

/********************************************************
  Poll for Daily Treasure
*********************************************************/

const daily = (app)=>{
  let UI

  const poll = ()=>{
    app.submit("dailyClaims").then(res=>{
      //update UI
      UI.lastClaim = res.data.lastMint.slice()
      UI.hasClaimed = res.data.hasClaimed.slice()
    }
    )
  }

  let tick = 0
  return ()=>{
    UI = app.UI.dailyTreasure
    if (!UI)
      return

    //every minute seconds 
    if (tick % 120 == 0)
      poll()

    tick++
  }
}

/********************************************************
  Poll for Explorer 
*********************************************************/

const explorers = (app)=>{
  //version 
  let v = app.params.version

  let UI = app.UI.main;

  const getTrouble = () => {
    //pull opposition to trouble 
    app.trouble.allActiveTrouble().then(res => {
      UI.activeTrouble = []

      res.forEach(o => {
        let actors = o._act.map(id => UI.actors[id])
        let shard = actors[0].shard 

        UI.activeTrouble.push(Object.assign({},o,{actors, shard, _data: o},shard.trouble))
      })
    }) 
  }

  const pollAdventurer = async(id)=>{
    let {data} = await app.submit("getCharacterData", {
      id
    })

    let _data = {
      id,
      name : data[ID_NAME] || "",
      _home: data[ID_HOME],
      _shard: data[ID_LOCATION],
      _cool: data[ID_COOL],
      _xp : data[ID_XP], 
    }

    //set UI 
    Vue.set(UI.actors, id, app.format.adventurer(_data))
  }

  const pollAllCharacters = async()=>{
    let {data} = await app.submit("allTokens")

    for(let x in data) {
      if (x.includes("adv.")) {
        pollAdventurer(x)
      }
    }

    //add shards from characters 
    Object.values(UI.actors).forEach(a => {
      //check if shard has been included - push otherwise 
      if(!UI.shards.map(s => s.id).includes(a._shard)){
        UI.shards.push(a.shard)
      }
    })
    //sort 
    UI.shards = UI.shards.sort((a,b)=>a._realm < b._realm) 
  }

  let tick = 0
  return async ()=>{
    if (tick % 4 == 0) {
      await pollAllCharacters()
      if(tick % 120 == 0) getTrouble()
    }
    tick++
  }
}

/********************************************************
  Poll for Tokens 
*********************************************************/

const tokens = (app)=>{
  let UI = app.UI.main

  const updateTokens = ()=>{
    app.submit("allTokens").then(res=>{
      let {data} = res
      //loop 
      Object.entries(TOKENS).forEach(e=>{
        let id = e[0]
          , _token = e[1];

        _token.val = data[id] || 0

        Vue.set(UI.tokens, id, _token)
      }
      )
    }
    )
  }

  //return polling function 
  let tick = 0
  return ()=>{
    //tick 
    tick++
    //every 2 seconds
    if (tick % 4 == 0) {
      //set ui 
      updateTokens()
    }
  }

}

/********************************************************
  Poll for Regions/Shards 
*********************************************************/

const shards = (app)=>{
  //version 
  let v = app.params.version

  //setup references
  let {seed, shardPeriodTimes, shardsPerPeriod, troublePercent} = app.params
    , {hexToNumber, hash} = app.utils
    , UI = app.UI.main
    , regions = app.regions;

  const statCheck = async () => {
    //get stats 
    for(let i = 0; i < UI.shards.length; i++) {
      //pull stats 
      let {data} = await app.submit("getAllStats", {
        id : UI.shards[i].id 
      }) 
      Object.assign(UI.shards[i], data)

      //check for trouble 
      if(UI.shards[i]._trouble){
        let _solved = await app.trouble.isSolved(UI.shards[i].trouble.id)
        UI.shards[i]._trouble = !_solved
      }
    }
  }

  //shard data of a given period 
  const shardDataOfPeriod = async (pid,pOfi,j)=>{
    //seed for generation - Ethereum Identity function - hash 
    let seed = hash("srd" + shardPeriodTimes[pid] + pOfi + j)
    //generate and format based upon seed - only use last 12 hash 
    let shard = app.format.shard(["srd", v.srd, seed.slice(-12)].join("."))
    
    //check for trouble 
    shard._trouble = (hexToNumber(seed,0,1) / 255) < troublePercent/100    

    UI.shards.push(shard)
  }

  //update all the random regions of the period 
  const update = ()=>{
    //first determine the periods 
    let now = Date.now() / 1000;
    let P = app.shards.periods = shardPeriodTimes.map(_p=>Math.floor(now / _p))
    //reset UI
    UI.shards = []
    //for each period get regions  
    P.forEach((p,i)=>{
      //get the number of shards 
      let spp = shardsPerPeriod[i]
      //loop through a number of shards
      for (let j = 0; j < spp; j++) {
        //set UI 
        shardDataOfPeriod(i, p, j)
      }
    }
    )
  }

  //return polling function 
  let tick = 0
  return ()=>{
    let tenMin = 2 * 60 * 10

    //poll after certain time 
    //10 minutes
    if ((tick % tenMin) == 0) {
      //poll for period 
      update()
    }
    if (tick % 120 == 0) {
      statCheck()
    }

    //tick 
    tick++
  }
}

/********************************************************
  Manager of all polls 
*********************************************************/

const PollManager = (app)=>{

  let shardPoll = shards(app)
    , tokenPoll = tokens(app)
    , explorerPoll = explorers(app)
    , dailyPoll = daily(app);

  app.poll = ()=>{
    shardPoll()
    tokenPoll()
    explorerPoll()
    dailyPoll()
  }

}

export {PollManager}
