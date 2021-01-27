//outlands data 
import {REALMS, ANCHORS, RISK, ANCHORRISK, SAFETY} from "../data/outlands.js"

const VERSIONS = {
  "1" : {
    "R" : 16,
    "sizes" : [1,1,2,2,2,2,3,3,3,3,3,3,3,4,4,5]  
  }
}

// SAFETY = ["safe","unsafe","dangerous","perilous"]
const SAFETYMOD = [5,3,0,-3,-5] // evil, chaotic, neutral, lawful, good
const SAFETYROLL = [0,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3]

const terrain = (app, _hash, realm) => {
  let {hexToNumber} = app.utils
  let hash = app.utils.hash(_hash + "-terrain")  //hash for randomization

  let _ta = realm.terrain.map((n,i) => Array.from({length:n},(v,j) => i)).flat() //make an array of terrain types
  //return main terrain and sub-indicies 
  return [_ta[hexToNumber(hash,0,1) % 16], hexToNumber(hash,1,2), hexToNumber(hash,2,3)] 
}

const gen = (app, seedArray) => {
  let {hexToNumber} = app.utils 

  let _v = seedArray[1]  //get seed version
    , hash = app.utils.hash(seedArray.join("."));  //hash for randomization

  //realm
  let _realm = hexToNumber(hash,0,2) % VERSIONS[_v].R  //determine realm

  //terrain
  let _terrain = terrain(app, hash, REALMS[_realm])

  //size - number of shards & anchors 
  let sizes = VERSIONS[_v].sizes  //size of region determined by version 
  let _size = sizes[hexToNumber(hash,2,3) % sizes.length]  //random size 

  //alignment
  let _align = REALMS[_realm].alignment  //pull alignments
  let _alignment = _align[hexToNumber(hash,3,4) % _align.length] // random alignment 

  //safety
  let _safeRoll = (hexToNumber(hash,4,5) % SAFETYROLL.length) + SAFETYMOD[_alignment]  //determine safety - roll + mod
  let _safety = _safeRoll < 0 ? 0 : _safeRoll > SAFETYROLL.length-1 ? 3 : SAFETYROLL[_safeRoll]   

  //temp 
  let _temps = REALMS[_realm].temp  //pull temps 
  let _temp = _temps[hexToNumber(hash,5,6) % _temps.length]
  
  //anchors - each shard is based on an anchor 
  let _anchors = REALMS[_realm].anchors  //pull anchors
  let anchor = {
    id : _anchors[hexToNumber(hash,6,7) % _anchors.length],
    rarity : app.rarity.getRarity("0x"+hash.slice(7), 1)
  }

  return {
    id : seedArray.join("."),
    nft : seedArray[0]+"."+_v,
    v : _v,
    seed : seedArray[2],
    _realm,
    _alignment,
    _safety,
    _temp,
    _terrain,
    anchor,
    _trouble : false,
    ecl : 0  
  }
}

export {gen as ShardGen}