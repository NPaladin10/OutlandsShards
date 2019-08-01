const dF = (rng)=>{
  return rng.weighted([-4, -3, -2, -1, 0, 1, 2, 3, 4], [1, 4, 10, 16, 19, 16, 10, 4, 1])
}

//pull hero data from chain
const getHeroDataForChallenge = (heroes)=>{
    //setup return 
    let H = {
        _all: {},
        //ids are based on which hero will respond to a certain skill
        skillCross: heroes.map(h => h.id),
        //return all unique as an array 
        get all() {
            return Object.values(this._all)
        },
        get bySkill() {
            return this.skillCross.map(v=>this._all[v])
        }
    }
    //build 
    heroes.forEach((h,i)=>{
        H._all[h.id] = Object.assign({
            xp: 0,
            stress: 0,
        }, h)
    }
    )
    //return heroes
    return H
}

const resolvers = (app)=>{
  //Challenge Resolution based upon pulled data 
  app.resolveChallenge = (data)=>{
    let heroes = getHeroDataForChallenge(data.heroes)
    let {challenge, hash} = data
    //unique hash for resolution
    hash = hash || ethers.utils.solidityKeccak256(['uint256', 'uint256', 'address', 'uint256'], [challenge.period, challenge.id, challenge.player, Date.now()])
    //create the RNG
    let rng = new Chance(hash)
    //baskic challenge data     
    let D = challenge.diff
    let size = challenge.sz
    //for random picks
    let rSkill = [0, 1, 2, 3, 4, 5]
      , rAprch = [0, 1, 2, 3, 4, 5];
    rSkill.splice(challenge.skillId, 1)
    rAprch.splice(challenge.approachId, 1)
    //set skills and approaches 
    let skills = []
      , approaches = [];
    let i = 0
    for (i = 0; i < size; i++) {
      skills.push(rng.weighted([challenge.skillId, rng.pickone(rSkill)], [1, 1]))
      approaches.push(rng.weighted([challenge.approachId, rng.pickone(rAprch)], [1, 1]))
    }
    //estblish challenge filter 
    const canChallenge = ()=>{
      return heroes.all.reduce((hGo,h)=>{
        if (h.stress < 10)
          hGo.push(h)
        return hGo
      }
      , [])
    }
    //check to give xp 
    const giveXP = (h,SR)=>{
      //get xp at skill bonus rank - round up
      let nxp = Math.ceil(Math.pow(10, SR+1) / 20)
      if (nxp > h.xp) {
        h.xp = nxp 
      }
    }
    //repeat until finished or no one can challenge
    let points = 0
      , allR = [];
    while (skills.length > 0 && canChallenge().length > 0) {
      let s = skills[0]
      let a = approaches[0]
      //check which hero can be used 
      let h = heroes.bySkill[s]
      let alt = rng.pickone(canChallenge())
      h = h.stress > 9 ? alt : h
      //check for approach bonus 
      let AB = h.approaches.includes(a) ? 1 : 0
      let skillR = h.skillsById[s]
      let SB = skillR + AB
      //roll + bonus 
      //Want the result to be 0 or greater 
      let R = (dF(rng) + SB) - (D + dF(rng))
      allR.push(R)
      //check for result 
      if (R < 0) {
        h.stress += -R
        //give xp 
        giveXP(h, skillR)
      } else if (R == 0) {
        h.stress += 1
        //give xp 
        giveXP(h, skillR)
        //remove the skill - it is complete 
        skills.shift()
        approaches.shift()
        //give points 
        points += Math.pow(10, D - SB)
      } else {
        //remove the skill - it is complete 
        skills.shift()
        approaches.shift()
        //give points 
        points += Math.pow(10, D - SB)
      }
    }
    //check for reward - Diamond or a color 
    let reward = [rng.weighted([0, challenge.approachId + 1], [2, 3]), Math.pow(2, D)]
    let faction = heroes.bySkill[challenge.skillId].faction
    //return result
    let now = Date.now() / 1000
    return {
      //result for compact repesentation 
      res : {
        c : [challenge.period,challenge.id],
        hash,
        //keep skill cross
        heroes: heroes.skillCross,
        //previous exp 
        xp: heroes.bySkill.map(h=>h._xp),
      },
      faction,
      //heroes 
      heroes: heroes.all,
      //rewards 
      points: Math.round(points),
      xp: heroes.all.map(h=>h.xp),
      reward: skills.length == 0 ? reward : [0, 0],
      //no cool for no stress - every stress gives another 
      now,
      cool: heroes.all.map(h=>{
        let nc = now + (h.stress * challenge.sCool)
        return nc.toFixed()
      }
      ),
    }
  }

}

export {resolvers}
