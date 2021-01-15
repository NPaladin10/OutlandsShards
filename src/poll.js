//outlands data 
import*as OutlandsCore from "../data/outlands.js"
//token data 
import {TOKENS} from "../data/tokenlist.js"
//generators 
import {ShardGen} from "../gen/shard.js"
import {AdventurerGen} from "../gen/adventurer.js"

const ADVENTURERSKILLS = ["Academic", "Diplomat", "Explorer", "Engineer", "Rogue", "Soldier"]

const ID_EID = 0
  , ID_OWNER = 1
  , ID_HOME = 2
  , ID_LOCATION = 3
  , ID_COOL = 4
  , ID_XP = 5;

/*
  Text Formatting
*/

const formatAdventurer = (app,_adv)=>{
  _adv.skills = {
    ids: _adv._skills,
    text: Object.keys(_adv._skills).map(si=>ADVENTURERSKILLS[Number(si)]).join("/")
  }

  return Object.assign({
    _shard: _adv._shard || null,
    get shard() {
      return this._shard ? formatShard(app, ShardGen(app, this._shard.split("."))) : null
    }
  }, _adv)
}

const formatShard = (app,_shard)=>{
  //handle anchor 
  let {id, rarity} = _shard.anchor
  let risk = OutlandsCore.ANCHORRISK[id - 1]

  //add information 
  Object.assign(_shard.anchor, {
    text: OutlandsCore.ANCHORS[id - 1],
    risk: [risk, OutlandsCore.RISK[risk]]
  })

  //text and formatting 
  return Object.assign({
    alignment: OutlandsCore.ALIGNMENTS[_shard._alignment],
    safety: OutlandsCore.SAFETY[_shard._safety],
    climate: OutlandsCore.CLIMATES[_shard._temp],
    realmName: OutlandsCore.REALMS[_shard._realm].name,
    //find any adventurers for hire 
    get advForHire() {
      //get any adventurers for hire 
      let advSeed = localStorage.getItem("adv." + this.id)
      return !advSeed ? null : formatAdventurer(app, AdventurerGen(app, {
        id: advSeed,
        _home: this.id
      }))
    }
  }, _shard)
}

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
    let genData = {
      id,
      _home: data[ID_HOME]
    }

    let adv = formatAdventurer(app, AdventurerGen(app, genData))
    adv._shard = data[ID_LOCATION]

    //set UI 
    Vue.set(UI.adventurers, id, adv)
  }

  const pollExplorer = (id)=>{
    app.submit("getCharacterData", {
      id
    }).then(res=>{
      if (res.data[ID_OWNER] != app.player)
        return

      let _id = id.split(".")
        , seed = _id[2]
        , _shard = res.data[ID_LOCATION];

      let e = {
        id,
        nft: _id[0] + "." + _id[1],
        seed,
        _home: res.data[ID_HOME],
        _shard,
        _cool: res.data[ID_COOL],
        _xp: res.data[ID_XP],
        _act: "",
        get shard() {
          return formatShard(app, ShardGen(app, this._shard.split(".")))
        }
      }

      //set UI 
      Vue.set(UI.explorers, id, e)
    }
    )
  }

  const pollAllCharacters = ()=>{
    //for every version check for balance 
    for (let i = 1; i <= v.exp; i++) {
      app.submit("balanceOfNFT", {
        nft: "exp." + i
      }).then(res=>{
        //array of ids  
        res.data.forEach(pollExplorer)
      }
      )
    }

    for (let i = 1; i <= v.adv; i++) {
      app.submit("balanceOfNFT", {
        nft: "adv." + i
      }).then(res=>{
        //array of ids  
        res.data.forEach(pollAdventurer)
      }
      )
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
    return formatShard(app, ShardGen(app, ["srd", v, seed]))
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
        //push 
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
