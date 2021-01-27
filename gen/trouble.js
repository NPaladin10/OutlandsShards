const VERSIONS = {
  "1" : {}
}

// SAFETY = ["safe","unsafe","dangerous","perilous"]
const ADVENTURERSKILLS = ["Academic","Diplomat","Explorer","Engineer","Rogue","Soldier"]
// SAFETY = ["safe","unsafe","dangerous","perilous"]
const NCHALLENGE = [3,3,3,4,4,4,4,5,5,5,5,5,5,6,6,6]
//skills that the adventurers face - based upon the skill of the trouble - 50% is always the base skill 
const SKILLMIX = {
  "0" : [1,1,2,2,3,3,3,4],
  "1" : [0,0,2,2,3,3,4,4],
  "2" : [0,1,3,3,4,4,5,5],
  "3" : [0,0,0,1,1,2,2,4],
  "4" : [0,1,2,2,3,5,5,5],
  "5" : [0,1,2,2,3,4,5,5],
}


const gen = (app, shard) => {
  let {hexToNumber} = app.utils
  let {v, seed} = shard
  let day = Math.floor(app.now/3600/24)
  let id = ["tbl",v,seed,day].join(".")
  
  //rng for generation
  let hash = app.utils.hash(id)

  //skill 
  let skill = hexToNumber(hash, 0, 2) % 6

  //number of challeges to face 
  let nC = NCHALLENGE[hexToNumber(hash, 2, 3) % 16]
  //determine skill for each challenge 
  let _c = Array.from({length: nC},(v,i)=> {
     //hash
    let _hash = app.utils.hash(id + i)
    //determine the skill of the step
    let si = hexToNumber(_hash, 0, 1) % 16
    //50 % skill of the trouble 
    return si < 8 ? SKILLMIX[skill][si] : skill   
  })

  //rarity 
  let rank = app.rarity.getRarity("0x"+hash.slice(7), 1)

  return {
    id,
    v,
    day,
    _c,
    skill,
    rank
  }
}

export {gen as TroubleGen}