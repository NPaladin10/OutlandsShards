const hexToNumber = (hex,start,stop)=>{
  let slice = hex.slice(2).slice(start * 2, stop * 2)
  return parseInt(slice, 16)
}

const ADVENTURERSKILLS = ["Academic","Diplomat","Explorer","Engineer","Rogue","Soldier"]

const poll = (eth)=>{
  //count ticks 
  let tick = 0

  let app = eth.app
    , UI = app.UI.main
    , tokens
    , C;

  eth.adventurerFromSeed = (seed) => {
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

  const pollExplorer = async(id)=>{
    let seed = await C.getCurrentLocation(id)
      , _shard = eth.shardBySeed(seed);

    let cool = await C.getCooldown(id)
      , _cool = cool.toNumber();

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

  const pollExplorers = async()=>{
    tokens[1000000].ids.forEach(id=> {
      pollExplorer(id)
    })
  }

  return ()=>{
    tick++

    tokens = UI.tokens
    C = eth.contracts.Characters

    if(tokens[1000000]){
      if(tick % 4 == 0) pollExplorers()
    }
  }
}

export {poll}
