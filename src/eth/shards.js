//outlands data 
import*as OutlandsCore from "../outlands.js"

const ZeroByte = "0x0000000000000000000000000000000000000000000000000000000000000000"

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
  let OR = null, OS = null, nRegions = OutlandsCore.REGIONS.length, regions = {}, shards = {};

  //set regions
  OutlandsCore.REGIONS.forEach((r,i) => {
    //data format
    let R = {
      id : i+1,
      _shards : [],
      periodShards : [],
      realmName: OutlandsCore.REALMS[r.realm - 1],
      get shards () {
        return this._shards.concat(this.periodShards)
      },
      get claimedShards () {
        return this.shards.filter(s => s._claimed)
      },
      _vId : ""  
    }

    //set region 
    regions[i+1] = Object.assign(R,r) 
  })
  eth._regions = regions   

  //setup references
  let app = eth.app
    , UI = app.UI.main
    , BN = eth.BN
    , keccak256 = eth.keccak256
    , hexZeroPad = eth.utils.hexZeroPad;

  //generate from seed 
  eth.shardFromSeed = (seed) => {
    if(seed == ZeroByte) return null
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
      region : r,
      regionName : regions[r].name,
      _claimed : false  
    }
  }

  //shard data of a given period 
  const shardDataOfPeriod = (pid, pOfi, j) => {
    //format numbers 
    let pt = BN.from(_periodTimes[pid]).toHexString()
    pOfi = BN.from(pOfi).toHexString()
    j = BN.from(j).toHexString()
    //keccak256(abi.encode(address(this), pt, pOfi, j))
    let seed = keccak256(["address", "uint256", "uint256", "uint256"], [OS.address, pt, pOfi, j]) 
    
    //generate based upon seed 
    return eth.shardFromSeed(seed)
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
    let now = Date.now()/1000;

    app.periods = _periodTimes.map(_p=> Math.floor(now/_p))

    OR.countOfRegions().then(n => nRegions = n.toNumber())
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
        //push to objects
        shards[shard._seed] = shard 
        regions[shard.region].periodShards.push(shard)
      }
    }
    )

    //update UI
    UI.regions = regions
    eth._shards = shards
  }

  const shardByPage = () => {
    OS.countOfShards().then(n => {
      //convert to numner 
      n = n.toNumber()
      let base = 1000000001
        , pages = Array.from({length: 1+Math.floor(n/50)}, (v,i) => {
            let m = n < i*50+50 ? n-(i*50) : 50 

            return Array.from({length: m}, (w,j) => base + i*50 + j)
        });

      //loop through pages 
      pages.forEach(p => {

        OS.getClaimedShardsBatch(p).then(res => {
          let {rids, anchors} = res 

          //loop and set region 
          res.seeds.forEach((seed, j) => {
            let a = anchors[j],
              risk = OutlandsCore.ANCHORRISK[a-1]
              , r = rids[j].toNumber();

            //data formatting 
            let shard = {
              _id : p[j],
              _seed : seed,
              seed : seed.slice(2,7)+'...'+seed.slice(-4),
              anchor: {
                id: a,
                rarity: getRarity(seed, eth.rarity[1]),
                text: OutlandsCore.ANCHORS[a - 1],
                risk: [risk, OutlandsCore.RISK[risk]]
              },
              region : r,
              regionName : regions[r].name,
              _claimed : true   
            }

            //push to objects
            shards[shard._seed] = shard 
            //shard ids 
            let sids = regions[shard.region].shards.map(s => s._seed)
            if(!sids.includes(shard._seed)) {
              regions[shard.region]._shards.push(shard) 
            }
          })
        })

      })
    })
  }

  //return polling function 
  return (C)=>{
    let tenMin = 2*60*10
    //tick 
    tick++
    //set OS 
    OS = C.OutlandsShards
    OR = C.OutlandsRegions

    //poll after certain time 
    //10 minutes
    if((tick % tenMin) == 1) {
      //poll for period 
      periodPoll()
    }
    if((tick % tenMin) == 2) {
      //poll for period 
      updatePeriodShards()
    }
    //every minute 
    if((tick % 2*60) == 0) {
      //poll for newly created shards 
      shardByPage()
    }
  }
}

export {poll}