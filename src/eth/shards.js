//outlands data 
import*as OutlandsCore from "../outlands.js"

const _shardsPerPeriod = [[24, 3, 8], [24, 3, 8], [24, 3, 8]]
const _periodTimes = [4 * 60 * 60, 8 * 60 * 60, 24 * 60 * 60]

const hexToNumber = (hex,start,stop)=>{
  let slice = hex.slice(2).slice(start * 2, stop * 2)
  return parseInt(slice, 16)
}

//given seed and rarity 
const getRarity = (seed, R)=>{
  let reduced = hexToNumber(seed, R.start, R.stop) % R.max
  let value = R.steps.length + 1

  for (let i = 0; i < R.steps.length; i++) {
    if (reduced < R.steps[i]) {
      value = i + 1
      break
    }
  }

  return value
}

const poll = (eth)=>{
  //count ticks 
  let tick = 0
 
  //data to call later
  let OS = null, nRegions = OutlandsCore.REGIONS.length, regions = {}, shards = {};

  //set regions
  OutlandsCore.REGIONS.forEach((r,i) => {
    //data format
    let R = {
      _shards : [],
      periodShards : [],
      realmName: OutlandsCore.REALMS[r.realm - 1],
      get shards () {
        return this._shards.concat(this.periodShards)
      } 
    }

    //set region 
    regions[i+1] = Object.assign(R,r) 
  })   

  //setup references
  let app = eth.app
    , UI = app.UI.main
    , BN = eth.BN
    , keccak256 = eth.keccak256
    , hexZeroPad = eth.utils.hexZeroPad;

  //shard data of a given period 
  const shardDataOfPeriod = (pid, pOfi, j) => {
    //format numbers 
    let pt = BN.from(_periodTimes[pid]).toHexString()
    pOfi = BN.from(pOfi).toHexString()
    j = BN.from(j).toHexString()
    //keccak256(abi.encode(address(this), pt, pOfi, j))
    let seed = keccak256(["address", "uint256", "uint256", "uint256"], [OS.address, pt, pOfi, j]) 
    //region 
    let r = 1 + BN.from(seed).mod(nRegions).toNumber()
    //anchors 
    let anchors = regions[r].anchors
    let a = anchors[hexToNumber(seed, 1, 2)%anchors.length]
    let risk = OutlandsCore.ANCHORRISK[a-1]
    
    //data formatting 
    return {
      _seed : seed,
      seed : seed.slice(2,7)+'...'+seed.slice(-4),
      anchor: {
        id: a,
        rarity: getRarity(seed, eth.rarity[1]),
        text: OutlandsCore.ANCHORS[a - 1],
        risk: [risk, OutlandsCore.RISK[risk]]
      },
      region : r  
    }
  }

  //determine the number of shards in a period 
  const shardsInPeriod = (i, p)=>{
    let pt = BN.from(_periodTimes[i]).toHexString()
      , ofPi = BN.from(p).toHexString();
    //seed for generation
    //abi.encode(address(this), pt, ofPi) 
    let seed = keccak256(["address", "uint256", "uint256"], [OS.address, pt, ofPi])

    let spp = _shardsPerPeriod[i]
    //start with base 
    let count = spp[0]
    //loops as required in spp 
    for (let i = 0; i < spp[1]; i++) {
      count += 1 + (hexToNumber(seed, i, i+1) % spp[2]);
    }

    return count
  }

  //update period numbers 
  const periodPoll = ()=>{
    OS.getCurrentPeriod().then(p=>{
      app.periods = p.map(_p=>_p.toString())
    }
    )

    OS.nRegions().then(n => nRegions = n.toNumber())
  }

  //update all the random shards of the period 
  const updatePeriodShards = ()=>{
    //first reset all region periodShards
    Object.values(regions).forEach(r => r.periodShards = [])
    //counting 
    let total = 0
    let p = app.periods
    //for each period get the count of shards 
    app.periods.forEach((p,i)=>{
      //get the number of shards
      let nsp = shardsInPeriod(i, p)
      //loop through a number of shards
      for(let j = 0; j < nsp; j++){
        let shard = shardDataOfPeriod(i, p, j)
        //push to region 
        regions[shard.region].periodShards.push(shard)
      }
    }
    )

    //update UI
    UI.regions = regions
  }

  //return polling function 
  return (_os)=>{
    let tenMin = 2*60*10
    //tick 
    tick++
    //set OS 
    OS = _os

    //poll after certain time 
    //10 minutes
    if((tick % tenMin) == 1) {
      //poll for period 
      periodPoll()
    }
    if((tick % tenMin) == 11) {
      //poll for period 
      updatePeriodShards()
    }
    //every minute 
    if((tick % 2*60) == 0) {
      //poll for newly created shards 
    }
  }
}

export {poll}