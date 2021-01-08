//Rarity calculations 
const Rarity = {
  "1": {
    "what": "Anchor Rarity",
    "max": 1024,
    "start": 0,
    "stop": 2,
    "steps": [410, 717, 922, 1023]
  }
}

const RarityManager = (app) => {

  //given seed and rarity 
  const getRarity = (seed, rid)=>{
    let R = Rarity[rid]
      , reduced = app.utils.hexToNumber(seed, R.start, R.stop) % R.max
      , value = R.steps.length + 1;

    for (let i = 0; i < R.steps.length; i++) {
      if (reduced < R.steps[i]) {
        value = i + 1
        break
      }
    }

    return value
  }

  app.rarity = {getRarity}
}

export {RarityManager}