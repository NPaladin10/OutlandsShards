//outlands data 
import*as OutlandsCore from "../outlands.js"

const _shardsPerPeriod = [[24, 3, 8], [24, 3, 8], [24, 3, 8]]
const _periodTimes = [4 * 60 * 60, 8 * 60 * 60, 24 * 60 * 60]

//data to call later
let nRegions = OutlandsCore.REGIONS.length
  , regions = {}
  , _anchors = {};

const poll = (app)=>{
  //setup references
  let appSeed = app.params.seed
    , hexToNumber = app.utils.hexToNumber
    , UI = app.UI.main
    , BN = app.ETH.BN
    , keccak256 = app.ETH.keccak256;

  //shard data of a given period 
  const shardDataOfPeriod = (pid,pOfi,j)=>{
    //format numbers 
    let pt = BN.from(_periodTimes[pid]).toHexString()
    pOfi = BN.from(pOfi).toHexString()
    j = BN.from(j).toHexString()
    //keccak256(abi.encode(address(this), pt, pOfi, j))
    let seed = keccak256(["address", "uint256", "uint256", "uint256"], [appSeed, pt, pOfi, j])

    //generate based upon seed 
    return app.shardFromSeed(seed)
  }

  //determine the number of shards in a period 
  const shardsInPeriod = (i,p)=>{
    let pt = BN.from(_periodTimes[i]).toHexString()
      , ofPi = BN.from(p).toHexString();
    //seed for generation
    //abi.encode(address(this), pt, ofPi) 
    let seed = keccak256(["address", "uint256", "uint256"], [appSeed, pt, ofPi])

    let spp = _shardsPerPeriod[i]
    //start with base 
    let count = spp[0]
    //loops as required in spp 
    for (let i = 0; i < spp[1]; i++) {
      count += 1 + (hexToNumber(seed, i, i + 1) % spp[2]);
    }

    return count
  }

  //update all the random shards of the period 
  const updatePeriodShards = ()=>{
    //first reset all region periodShards
    Object.values(regions).forEach(r=>r.periodShards = [])
    //counting 
    let total = 0
    let p = app.periods
    //for each period get the count of shards 
    app.periods.forEach((p,i)=>{
      //get the number of shards
      let nsp = shardsInPeriod(i, p)
      //loop through a number of shards
      for (let j = 0; j < nsp; j++) {
        let shard = shardDataOfPeriod(i, p, j)
        //push to objects
        regions[shard.region].periodShards.push(shard)
      }
    }
    )

    //update UI
    UI.regions = regions
  }

  //update period numbers 
  const periodPoll = ()=>{
    let now = Date.now() / 1000;
    app.periods = _periodTimes.map(_p=>Math.floor(now / _p))
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
      periodPoll()
    }
    if ((tick % tenMin) == 2) {
      //poll for period 
      updatePeriodShards()
    }
    //every minute 
    if ((tick % 2 * 60) == 0) {//poll for newly created shards 
    //shardByPage()  
    }
  }
}

const ShardManager = (app)=>{

  let GK = app.gatekeeper
    , hexToNumber = app.utils.hexToNumber;

  const NFTID_REGIONS = 10 ** 9
    , NFTID_SHARDS = 10 ** 9 + 10 ** 6;

  /*
    regions 
  */
  const ID_NFT = 0

  //set regions from core data 
  OutlandsCore.REGIONS.forEach((r,i)=>{
    let id = NFTID_REGIONS + i + 1
    //data format
    let R = {
      id,
      _shards: [],
      periodShards: [],
      realmName: OutlandsCore.REALMS[r.realm - 1],
      get shards() {
        return this._shards.concat(this.periodShards)
      },
      get claimedShards() {
        return this.shards.filter(s=>s._claimed)
      },
      _vId: "",
    }

    //set region 
    regions[id] = Object.assign(R, r)
    _anchors[id] = r.anchors
  }
  )

  //getter for later 
  const getRegion = (id)=>{
    return regions[id]
  }

  /*
        random region depending upon current region count 
        - thus it may change if regions are added 
    */
  const genRegionFromSeed = (seed)=>{
    return NFTID_REGIONS + 1 + (hexToNumber(seed, 0, 3) % Object.keys(regions).length);
  }

  //generates a shard from a given seed 
  const genShardFromSeed = (seed)=>{
    let r = genRegionFromSeed(seed)
    //anchor
    let n = _anchors[r].length
      , a = _anchors[r][hexToNumber(seed, 0, 1) % n];
    return {
      id: null,
      nft: NFTID_SHARDS,
      seed,
      r,
      a
    }
  }

  //app level functions 
  app.regions = {
    getRegion,
    genRegionFromSeed,
    genShardFromSeed,
    get all () {
      return regions
    } 
  }

  /*
    Shards 
  */
  const _seedToId = {}
    , ID_SEED = 1
    , ID_REGION = 2
    , ID_ANCHOR = 3;

  const getShardById = (id)=>{
    let stats = GK.getStats(id, [ID_NFT, ID_SEED, ID_REGION, ID_ANCHOR])

    return {
      id,
      nft: stats[0],
      seed: stats[1],
      r: stats[2],
      a: stats[3]
    }
  }

  const getShardBySeed = (seed)=>{
    let id = _seedToId[seed]
    //check for claim 
    return !id ? genShardFromSeed(seed) : getShardById(id)
  }

  //set data
  const mint = (seed)=>{
    //mint 
    let id = GK.mintNFT(NFTID_SHARDS)
    //generate 
    let {r, a} = genShardFromSeed(seed)
    //set stats 
    GK.setStats(id, [ID_NFT, ID_SEED, ID_REGION, ID_ANCHOR], [NFTID_SHARDS, seed, r, a])
  }

  //set shard functions 
  app.shards = {
    mint,
    poll: poll(app)
  }

  /*
    app level function 
  */

  //generate from seed 
  app.shardFromSeed = (seed)=>{
    //pull raw data 
    let {r, a} = getShardBySeed(seed)
      , risk = OutlandsCore.ANCHORRISK[a - 1]
      , rarity = app.rarity.getRarity(seed, 1);

    //data formatting 
    return {
      _seed: seed,
      seed: seed.slice(2, 7) + '...' + seed.slice(-4),
      anchor: {
        id: a,
        rarity,
        text: OutlandsCore.ANCHORS[a - 1],
        risk: [risk, OutlandsCore.RISK[risk]]
      },
      region: r,
      regionName: regions[r].name, 
      _claimed: false,
      get text() {
        return this.regionName +" "+ this.seed
      }
    }
  }

  Object.defineProperty(app, 'shardArray', { get: function() { 
    return Object.values(regions).map(r => r.shards).flat()
  } });
}

export {ShardManager}
