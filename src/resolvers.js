const dF = (rng) => {
    return rng.rpg("4d3",{sum:true}) - 8 
}

const resolveChallenge = (challenge, heroes) => {
    //unique hash for resolution
    let hash = ethers.utils.solidityKeccak256(['uint256','uint256','address','uint256'], [challenge.period, challenge.i, challenge.player, Date.now()])
    //create the RNG
    let rng = new Chance(hash)
    //baskic challenge data     
    let D = challenge.diff
    let size = challenge.sz
    //for random picks
    let rSkill = [1,2,3,4,5,6], rAprch = [1,2,3,4,5,6];
    rSkill.splice(challenge.skill,1)
    rAprch.splice(challenge.approach,1)
    //set skills and approaches 
    let skills = [], approaches = [];
    let i = 0
    for(i = 0; i < size; i++) {
        skills.push(rng.weighted([challenge.skill,rng.pickone(rSkill)],[1,1]))
        approaches.push(rng.weighted([challenge.approach,rng.pickone(rAprch)],[1,1]))
    }
    //estblish challenge filter 
    const canChallenge = () => {
        return heroes.byId.map((hGo,h) => {
            if(h.stress < 10) hGo.push(h)
            return hGo
        },[])    
    }
    //repeat until finished or no one can challenge
    while(skills.length>0 && canChallenge().length > 0) {
        let s = skills[0]
        let a = approaches[0]
        //check which hero can be used 
        let h = heroes.bySkill[s]
        if(h.stress > 9) {
            h = rng.pickone(canChallenge())
        }
        //check for approach bonus 
        let AB = h.approaches.includes(a) ? 1 : 0
        //roll + bonus 
        let R = dF(rng) + h.skillsById[s] + AB
        //check for result 
        if(R < 0){
            h.stress += -R 
            //give xp 
            h.xp += Math.pow(10,D) / 5
        }
        else if (R == 0){
            h.stress += 1 
            //give xp 
            h.xp += Math.pow(10,D) / 5
            //remove the skill - it is complete 
            skills.shift() 
            approaches.shift()
        }
        else {
            //remove the skill - it is complete 
            skills.shift() 
            approaches.shift()
        }
    }
    //check for reward - Diamond or a color 
    let reward = skills.length == 0 ? [rng.weighted([0,challenge.approach+1],[2,3]),Math.pow(2,D)] : []
    //return result
    return {
        i : challenge.id,
        hash,
        //if complete - all skills overcome 
        res : skills.length == 0,
        //base cool is next period - extra for extra stress
        cool : heroes.byId.map(h => [h.i, challenge.period + 1 + Math.floor(h.stress/5)]),
        reward
    }
}