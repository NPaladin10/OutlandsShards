const poll = (eth)=>{
  //count ticks 
  let tick = 0

  let app = eth.app
    , UI = app.UI.main
    , tokens
    , CL
    , Cooldown;

  const pollExplorer = async(id)=>{
    let seed = await CL.shardLocation(id)
      , _shard = eth.shardBySeed(seed);

    let cool = await Cooldown.cooldown(id)
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
    CL = eth.contracts.CharacterLocation
    Cooldown = eth.contracts.Cooldown

    if(tokens[1000000]){
      if(tick % 4 == 0) pollExplorers()
    }
  }
}

export {poll}
