//generators 
import {ShardGen} from "./shard.js"

const VERSIONS = {
  "1" : {
    "wae" : {         //water air earth based upon home terrain 
      "0" : [5,2,1],
      "1" : [0,4,4],
      "2" : [1,3,4],
      "3" : [3,2,3],
      "4" : [1,4,3],
      "5" : [1,3,4],
      "6" : [1,5,2],
    },
    "forms" : {
      "w" : ['whale/narwhal','squid/octopus','dolphin/shark','alligator/crocodile','turtle','crab/lobster','fish','predatory fish','frog/toad','eel/snake','oyster/snail','jelly/anemone','insect/barnacle','amorphous','grass/vine','geometric/illusion'],
      "a" : ['pteranadon','condor','eagle/owl','hawk/falcon','crow/raven','crane/stork','gull/waterbird','songbird/parrot','chicken/duck','bee/wasp','beetle','butterfly','locust/dragonfly','fly/mosquito','gaseous/web','particles'],
      "e" : ['dinosaur/megafauna','elephant','ox/rhinoceros','bear/ape','deer/horse','lion/panther','wolf/boar','snake/lizard','rat/weasel','ant/centipede','slug/worm','beetle/beetle/termite/tick','tree/tree/bush/fungus','flower/grass/vine/cactus','amorphous/geometric','square/crystalline']
    },
    "elements" : ['void/divination','spirit/darkness/darkness/metal','fire/fire/light/luck','stone/stone/ground/metal','water/water/ice/time','air/storm','life/plant/plant/transformation','enchantment'],
    "levels" : [32769,49153,57345,61441,63489,64513,65025,65281,65409,65473,65505,65521,65529,65533,65535],
    "stages" : [1,1,2,2,2,3,3,3]
  }
}

const getLevel = (n, levels)=> {
  return 
}

const form = (app, v, hash, shard) => {
  let {hexToNumber} = app.utils
  let _hash = app.utils.hash(hash + "-form")  //hash for randomization

  //water air earth 
  let _wae = VERSIONS[v].wae[shard._terrain[0]].map((n,i) => Array.from({length:n},(v,j) => ["w","a","e"][i])).flat() //make an array base forms 
  let _waeId = _wae[hexToNumber(hash,0,1) % 8]
  
  //base form 
  let _base = hexToNumber(hash,1,2) % 16
  let baseArr = VERSIONS[v].forms[_waeId][_base].split("/")
  let base = baseArr[hexToNumber(hash,2,3) % baseArr.length]
  
  //return form     
  return {
    wae : _waeId,
    _base,
    base 
  }
}

const stages = (app, v, hash, form) => {
  let {hexToNumber} = app.utils
  let _hash = app.utils.hash(hash + "-stages")  //hash for randomization

  let n = VERSIONS[v].stages[hexToNumber(hash,2,3) % VERSIONS[v].stages.length]

  return {n}
}


const gen = (app, data)=>{
  let {hexToNumber} = app.utils

  let {_home, id} = data
  let _id = id.split("."), v = _id[1];

  let shard = ShardGen(app, _home.split("."))  //shard data for terrain 

  let hash = app.utils.hash(_home+id)  //hash for randomization

  //determine the level 
  let LV = VERSIONS[v].levels
  let _l = hexToNumber(hash,0,2)  // 0 to 256^2 = 65535
  let level = 1+LV.indexOf(LV.find(v => _l <= v))

  //determine form 
  let _form = form(app, v, hash, shard)

  //determine stages - how many stages will it change 
  let _stages = stages(app,v,hash,_form) 

  //element 
  let _e = hexToNumber(hash,3,4) % VERSIONS[v].elements.length
  let eArr = VERSIONS[v].elements[_e].split("/")
  let eText = eArr[hexToNumber(hash,1,2) % eArr.length]

  return {
    id,
    nft : _id.slice(0,2).join("."),
    seed : _id[2],
    _home,
    form: _form,
    nS,
    element : {
      _e,
      text : eText
    },
    _lv : level
  }
}

export {gen as ElementalGen}
