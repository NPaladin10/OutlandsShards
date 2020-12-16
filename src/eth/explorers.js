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
      , _shard = eth.shards[seed];

    let cool = await Cooldown.cooldown(id)
      , _cool = cool.toNumber();

    let e = {
      _shard,
      shard: _shard ? _shard.regionName + ", " + _shard.seed : null,
      _cool
    }

    //set UI 
    Vue.set(UI.explorers, id, e)
  }

  const pollExplorers = async()=>{
    tokens[1000000].ids.forEach(id=> pollExplorer(id))
  }

  return ()=>{
    tick++

    tokens = UI.tokens
    CL = eth.contracts.CharacterLocation
    Cooldown = eth.contracts.Cooldown

    if(UI.show == "explorers" && tokens[1000000]){
      pollExplorers()
    }
  }
}

export {poll}
