import {init as uInit} from "./utilities.js"
const utils = uInit("OutlandsPlanes2019")
//handles eth interaction 
import * as eth from "./eth.js"
let {outlandsTrouble, outlandsHeroes} = eth.getContracts()


const addressFromTopic = (id, topic) => {
    return ethers.utils.getAddress(ethers.utils.hexStripZeros(topic[id])) 
}

//log check function - searches log back 256 block for a topic releveant to an address
const logCheck = (block,cAddress,topic) => {
    return new Promise((resolve, reject) => {
        let filter = {
            address: cAddress,
            fromBlock: block,
            toBlock: block,
            topics: [ topic ]
        }
        provider.getLogs(filter).then(resolve)  
    })
}

//pull hero data from chain
const getHeroDataForChallenge = (ids) => {
  return new Promise((resolve, reject) => {
    let heroes = {
        counts : {},
        _all : {},
        //ids are based on which hero will respond to a certain skill
        skillCross : ids,
        //return all unique as an array 
        get all() { return Object.values(this._all) },
        get bySkill () { return this.skillCross.map(v => this._all[v]) }
      }
      //check which heroes are complete 
      let hC = ids.map(v=>false)
      const isComplete = () => {
        return hC.reduce((all,v) => v && all,true)
      }

      //now get hero data 
      ids.forEach((hid,j) => {
        outlandsHeroes.Heroes(hid).then(data => {
          if(heroes.counts[hid]) heroes.counts[hid]++;
          else heroes.counts[hid] = 0;
          //data = [planeId,hash]
          heroes._all[hid] = Object.assign({stress:0,xp:0},utils.heroData(hid, data[0].toNumber(), data[1]))
          hC[j] = true
          //check for complete
          if(isComplete()) {
            resolve(heroes) 
          }
        })
      })
  })
}

//pull challenge data from chain
const getChallengeData = (pd,id) => {
  return new Promise((resolve,reject) => {
    outlandsTrouble.getChallengeById(id).then(C => {
      let plane = C[1].toNumber()
      let challenge = utils.planeTrouble(pd, id)
      //add data to challenge for later 
      challenge.player = C[0]
      challenge.heroes = C[2].map(v=>v.toNumber())
      //resolve after pulling data 
      getHeroDataForChallenge(challenge.heroes).then(heroes => resolve({challenge,heroes}))
    })
  })
}

const dF = (rng) => {
    return rng.weighted([-4,-3,-2,-1,0,1,2,3,4],[1,4,10,16,19,16,10,4,1])
}

const resolveChallenge = (data) => {
    let {challenge, heroes, hash} = data
    //unique hash for resolution
    hash = hash || ethers.utils.solidityKeccak256(['uint256','uint256','address','uint256'], [challenge.period, challenge.id, challenge.player, Date.now()])
    //create the RNG
    let rng = new Chance(hash)
    //baskic challenge data     
    let D = challenge.diff
    let size = challenge.sz
    //for random picks
    let rSkill = [0,1,2,3,4,5], rAprch = [0,1,2,3,4,5];
    rSkill.splice(challenge.skillId,1)
    rAprch.splice(challenge.approachId,1)
    //set skills and approaches 
    let skills = [], approaches = [];
    let i = 0
    for(i = 0; i < size; i++) {
        skills.push(rng.weighted([challenge.skillId,rng.pickone(rSkill)],[1,1]))
        approaches.push(rng.weighted([challenge.approachId,rng.pickone(rAprch)],[1,1]))
    }
    //estblish challenge filter 
    const canChallenge = () => {
        return heroes.all.reduce((hGo,h) => {
            if(h.stress < 10) hGo.push(h)
            return hGo
        },[])    
    }
    //repeat until finished or no one can challenge
    let points = 0, allR = [];
    while(skills.length>0 && canChallenge().length > 0) {
        let s = skills[0]
        let a = approaches[0]
        //check which hero can be used 
        let h = heroes.bySkill[s]
        let alt = rng.pickone(canChallenge())
        h = h.stress > 9 ? alt : h 
        //check for approach bonus 
        let AB = h.approaches.includes(a) ? 1 : 0
        //roll + bonus 
        //Want the result to be 0 or greater 
        let R = (dF(rng) + h.skillsById[s] + AB) - (D+dF(rng))
        allR.push(R)
        //check for result 
        if(R < 0){
            h.stress += -R 
            //give xp 
            h.xp += Math.pow(10,D) / 10
        }
        else if (R == 0){
            h.stress += 1 
            //give xp 
            h.xp += Math.pow(10,D) / 10
            //remove the skill - it is complete 
            skills.shift() 
            approaches.shift()
            //give points 
            points += D - h.r > 0 ? D - h.r : 0
        }
        else {
            //remove the skill - it is complete 
            skills.shift() 
            approaches.shift()
            //give points 
            points += D - h.r > 0 ? D - h.r : 0
        }
    }
    //check for reward - Diamond or a color 
    let reward = [rng.weighted([0,challenge.approachId+1],[2,3]),Math.pow(2,D)]
    //return result
    return {
        allR,
        challenge,
        hash,
        points,
        heroes: heroes.all.map(h=>h.id),
        //if complete - all skills overcome 
        res : skills.length == 0,
        xp : heroes.bySkill.map(h=> h.xp/heroes.counts[h.id]),
        //base cool is next period - extra for extra stress
        cool : heroes.all.map(h => challenge.period + 1 + Math.floor(h.stress/5)),
        reward : skills.length == 0 ? reward : []
    }
}

//run the check on a particular current challenge
const challengeCheck = (ci) => {
  return new Promise((resolve, reject) => {
      //works with the current period
    outlandsTrouble.currentPeriod().then(pd => {
      getChallengeData(pd.toNumber(), ci).then(data => {
        resolve(resolveChallenge(data))
      })
    })
  })
}

export {challengeCheck}