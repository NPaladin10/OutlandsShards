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
      "e" : ['dinosaur/megafauna','elephant','ox/rhinoceros','bear/ape','deer/horse','lion/panther','wolf/boar','snake/lizard','rat/weasel','ant/centipede','slug/worm','beetle/beetle/termite/tick','tree/tree/bush/fungus','flower/grass/vine/cactus','amorphous/geometric','cubic/crystalline']
    },
    "elements" : ['void/divination','spirit/darkness/darkness/metal','fire/fire/light/luck','stone/stone/ground/metal','water/water/ice/time','air/storm','life/plant/plant/transformation','enchantment'],
    "levels" : [32769,49153,57345,61441,63489,64513,65025,65281,65409,65473,65505,65521,65529,65533,65535],
    "stages" : [1,1,2,2,2,3,3,3],
    "classes" : {
      "Brawler" : ["m","md+"],
      "Rover" : ["r","rd+"],
      "Weilder" : ["w","wd+"],
      "Tactician" : ["s","sd+"],
    }
  }
}
//when they get their stage transformation 
const NEWSTAGE = {
  "2" : [4],
  "3" : [3,5]
}
//stat cross index 
const STATCROSS = {
  "m" : 0,
  "r" : 1,
  "s" : 2,
  "w" : 3
}


let utils;

const pickFromArray = (_array, hash, n) => {
  let m = n+1
  let i = utils.hexToNumber(hash,n,m) % _array.length
  let _a2 = _array[i].split("/")
  let res = _a2[utils.hexToNumber(hash,m,m+1) % _a2.length]

  return {i,res}
}

const getLevel = (n, levels)=> {
  return 
}

//increase stats at every level up to 10 
const statImprove = (hash, lv, stats, primeStat) => {
  let _hash, si = STATCROSS[primeStat];
  let ni = lv < 10 ? lv : 10 

  for(let i = 0; i < ni; i++){
    _hash = utils.hash(hash + "-stat-"+i)  //hash for randomization

    //rotate trough stats 
    stats.forEach((v,j) => {
      let b = 50+v
      let r = utils.d100(_hash, j)

      //increase by 5 
      if(r > b) stats[j] += 5
      //double chance for prime stat 
      if(si == j){
        r = utils.d100(_hash, 4)
        if(r > stats[j]) stats[j] += 5
      }
    })
  }
}

const stages = (app, v, hash, wae, lv) => {
  let {hexToNumber} = utils
  let _hash = utils.hash(hash + "-stages")  //hash for randomization

  let n = VERSIONS[v].stages[hexToNumber(hash,0,1) % VERSIONS[v].stages.length]

  //number of stages - start with both at first stage 
  let s = ["fe"]   
  if(n == 2){
    //50% form & element, otherwise eiter form or element   
    s.push(["fe","fe","f","f","f","e","e","e"][hexToNumber(hash,1,2) % 8]) 
  }
  else if (n == 3) {
    s.concat((hexToNumber(hash,1,2) % 2) == 0 ? ["f","e"] : ["e","f"])
  }

  let form = {i:[], text:""}
  let element = {i:[], text:""}

  const pushInfo = (obj, info) => {
    obj.i.push(info.i)
    obj.text = obj.text == "" ? info.res : obj.text + "/" + info.res  
  }

  //loop  
  let hi = 2
  s.forEach((what, i) => {
    //has to be high enough level 
    if(i > 0 && lv < NEWSTAGE[n][i-1]) return

    if(what == "fe") {
      pushInfo(element, pickFromArray(VERSIONS[v].elements, hash, hi))
      pushInfo(form, pickFromArray(VERSIONS[v].forms[wae], hash, hi+2))
    }
    if(what == "e") {
      pushInfo(element, pickFromArray(VERSIONS[v].elements, hash, hi))
    }
    if(what == "f") {
      pushInfo(form, pickFromArray(VERSIONS[v].forms[wae], hash, hi+2))
    }

    //increase index 
    hi = what == "fe" ? hi+4 : hi+2
  })

  return {form, element}
}


const gen = (app, data)=>{
  //for all to use
  utils = app.utils 
  let {hexToNumber} = utils

  let {_home, id} = data
  let _id = id.split("."), v = _id[1];

  let shard = ShardGen(app, _home.split("."))  //shard data for terrain 

  let hash = app.utils.hash(_home+id)  //hash for randomization

  //determine the level 
  let LV = VERSIONS[v].levels
  let _l = hexToNumber(hash,0,2)  // 0 to 256^2 = 65535
  let level = 1+LV.indexOf(LV.find(v => _l <= v))

  //water air earth 
  let _waeArr = VERSIONS[v].wae[shard._terrain[0]].map((n,i) => Array.from({length:n},(v,j) => ["w","a","e"][i])).flat() //make an array base forms 
  let _wae = _waeArr[hexToNumber(hash,2,3) % 8]

  //determine stages - how many stages will it change 
  let {form, element} = stages(app,v,hash,_wae,level) 

  //get unique strangeness 
  let unq = [hexToNumber(hash,3,4),hexToNumber(hash,5,6)]

  //stats 
  let _stats = app.utils.stats(v, hash, 4)

  //class 
  let _class = Object.keys(VERSIONS[v].classes)[hexToNumber(hash,6,7) % 4]

  //roll for stat improvement 
  statImprove(hash, level, _stats, VERSIONS[v].classes[_class][0])

  return {
    id,
    nft : _id.slice(0,2).join("."),
    seed : _id[2],
    v : Number(v),
    _home,
    _wae, 
    _lv : level,
    form,
    element,
    _stats,
    _class
  }
}

export {gen as ElementalGen}
