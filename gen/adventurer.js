const HIRECOST = [0.1,1,10]
const ADVENTURERSKILLS = ["Academic","Diplomat","Explorer","Engineer","Rogue","Soldier"]

const skillGen = (RNG)=>{
  //skill 
  let skills = {}, si;
  
  //number of skills  
  let n = RNG.weighted([1,2,3],[1,1/16,1/1000])
  for(let i = 0; i < n; i++) {
    si = RNG.d6()-1
    skills[si] = skills[si] ? skills[si]+1 : 1 
  }

  let cost = HIRECOST[n-1]

  return {skills,cost}
}

const gen = (app, data)=>{
  let {_home, id} = data
  let _id = id.split(".")

  //establish chance RNG
  let RNG = new Chance(app.utils.hash(_home + id))

  //base skills 
  let {skills, cost} = skillGen(RNG)

  return {
    id,
    nft : _id.slice(0,2).join("."),
    seed : _id[2],
    _home,
    _skills : skills,
    cost,
    _cool: 0
  }
}

export {gen as AdventurerGen}
