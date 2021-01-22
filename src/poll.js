//token data 
import {TOKENS} from "../data/tokenlist.js"

const ID_OWNER = "own" 
  , ID_HOME = "hme"
  , ID_LOCATION = "loc"
  , ID_COOL = "col"
  , ID_XP = "cxp"
  , ID_EXCOOL = "ecl";

/********************************************************
  Poll for Daily
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

  const pollAdventurer = async(id)=>{
    let {data} = await app.submit("getCharacterData", {
      id
    })

    let _data = {
      id,
      _home: data[ID_HOME],
      _shard: data[ID_LOCATION],
      _cool: data[ID_COOL],
      _xp : data[ID_XP], 
    }

    //set UI 
    Vue.set(UI.actors, id, app.format.adventurer(_data))
  }

  const pollExplorer = async(id)=>{
    let {data} = await app.submit("getCharacterData", {
      id
    })

    let _data = {
      id,
      _home: data[ID_HOME],
      _shard: data[ID_LOCATION],
      _cool: data[ID_COOL],
      _xp : data[ID_XP], 
    }

    //set UI 
    Vue.set(UI.actors, id, app.format.explorer(_data))
  }

  const pollAllCharacters = async()=>{
    let {data} = await app.submit("allTokens")

    for(let x in data) {
      if(x.includes("exp.")) {
        pollExplorer(x)
      }
      else if (x.includes("adv.")) {
        pollAdventurer(x)
      }
    } 
  }

  let tick = 0
  return ()=>{
    tick++

    if (tick % 4 == 0)
      pollAllCharacters()
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
  let v = app.params.version.srd

  //setup references
  let {seed, shardPeriodTimes, shardsPerPeriod} = app.params
    , {hexToNumber, hash} = app.utils
    , UI = app.UI.main
    , regions = app.regions;

  //shard data of a given period 
  const shardDataOfPeriod = (pid,pOfi,j)=>{
    //seed for generation - Ethereum Identity function - hash 
    let seed = hash(shardPeriodTimes[pid] + pOfi + j).slice(-12)
    //generate and format based upon seed
    return app.format.shard(["srd", v, seed].join("."))
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
      //get the number
      let spp = shardsPerPeriod[i]
      //loop through a number of shards
      for (let j = 0; j < spp; j++) {
        //set UI 
        UI.shards.push(shardDataOfPeriod(i, p, j))
      }
    }
    )
    //sort 
    UI.shards = UI.shards.sort((a,b)=>a._realm < b._realm)
  }

  //return polling function 
  let tick = 0
  return ()=>{
    let tenMin = 2 * 60 * 10
    //tick 
    tick++

    //poll after certain time 
    //10 minutes
    if ((tick % tenMin) == 1) {
      //poll for period 
      update()
    }
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
