//outlands data 
import {REALMS, ANCHORS, RISK, ANCHORRISK, SAFETY} from "../data/outlands.js"

const CONTRACTTOVERSION = {
    "0xe9FD8F89c0b96eE174197cA3d29F9Dcc684B991F" : "1"  
}

const VERSIONS = {
  "1" : {
    "index" : {
        "realm" : 0,
        "anchor" : 1,
        "color" : 2,
    },
    "R" : 16,
    "anchors" : 4,
    "colors" : 3
  }
}

//COLORS
const COLORS = ["Ruby","Emerald","Sapphire"]

// SAFETY = ["safe","unsafe","dangerous","perilous"]
const SAFETYMOD = [5,3,0,-3,-5] // evil, chaotic, neutral, lawful, good
const SAFETYROLL = [0,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3]

let hexToNumber, keccak256;

const terrain = (_seed, realm) => {
  let hash = keccak256(["bytes32","string"], [_seed, "-terrain"])  //hash for randomization

  let _ta = realm.terrain.map((n,i) => Array.from({length:n},(v,j) => i)).flat() //make an array of terrain types
  //return main terrain and sub-indicies 
  return [_ta[hexToNumber(hash,0,1) % 16], hexToNumber(hash,1,2), hexToNumber(hash,2,3)] 
}

const gen = (app, contract, id) => {
  hexToNumber = app.utils.hexToNumber 
  keccak256 = app.eth.keccak256

  let v = CONTRACTTOVERSION[contract], V = VERSIONS[v];
  let seed = keccak256(["address","uint256"], [contract, id])

  let _realm = hexToNumber(seed, V.index.realm, V.index.realm+1) % V.R
    , _anchor = hexToNumber(seed, V.index.anchor, V.index.anchor+1) % V.anchors
    , _color = hexToNumber(seed, V.index.color, V.index.color+1) % V.colors; 
  
  //terrain
  let _terrain = terrain(seed, REALMS[_realm])

  return {
    id,
    nft : contract,
    v,
    _seed : seed,
    seed : seed.slice(2,7) + "..." + seed.slice(-5),
    _realm,
    _anchor,
    _color,
    color : COLORS[_color],
    _terrain
  }
}

export {gen as ShardGenEth}