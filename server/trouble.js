const {planeTrouble, heroData} = require('./utilities');
const Chance = require('chance');
const ethers = require('ethers');
const express = require('express');
const router = express.Router();

//ethers.utils.hexlify(ethers.utils.toUtf8Bytes('{"planeId":5}'))
//0x7b22706c616e654964223a357d
//ethers.utils.hexlify(ethers.utils.toUtf8Bytes('{"nextPeriod":true}'))
//0x7b226e657874506572696f64223a747275657d

//keep an array of submitted 
let submitted = new Map()

const dF = (rng)=>{
    return rng.weighted([-4, -3, -2, -1, 0, 1, 2, 3, 4], [1, 4, 10, 16, 19, 16, 10, 4, 1])
}

const resolveChallenge = (data)=>{
    let {challenge, heroes, hash} = data
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
        //roll + bonus 
        //Want the result to be 0 or greater 
        let R = (dF(rng) + h.skillsById[s] + AB) - (D + dF(rng))
        allR.push(R)
        //check for result 
        if (R < 0) {
            h.stress += -R
            //give xp 
            h.xp += Math.pow(10, D) / 10
        } else if (R == 0) {
            h.stress += 1
            //give xp 
            h.xp += Math.pow(10, D) / 10
            //remove the skill - it is complete 
            skills.shift()
            approaches.shift()
            //give points 
            points += D - h.r > 0 ? D - h.r : 0
        } else {
            //remove the skill - it is complete 
            skills.shift()
            approaches.shift()
            //give points 
            points += D - h.r > 0 ? D - h.r : 0
        }
    }
    //check for reward - Diamond or a color 
    let reward = [rng.weighted([0, challenge.approachId + 1], [2, 3]), Math.pow(2, D)]
    //return result
    return {
        allR,
        challenge,
        hash,
        points,
        heroes: heroes.all.map(h=>h.id),
        //if complete - all skills overcome 
        res: skills.length == 0,
        xp: heroes.all.map(h=>h.xp),
        //base cool is next period - extra for extra stress
        cool: heroes.all.map(h=>challenge.period + 1 + Math.floor(h.stress / 5)),
        reward: skills.length == 0 ? reward : []
    }
}

const init = (eth,ping)=>{
    //get contract 
    let {outlandsHeroes, outlandsTrouble, outlandsXP, logCheck} = eth

    //pull hero data from chain
    const getHeroDataForChallenge = (ids)=>{
        return new Promise((resolve,reject)=>{
            let heroes = {
                counts: {},
                _all: {},
                //ids are based on which hero will respond to a certain skill
                skillCross: ids,
                //return all unique as an array 
                get all() {
                    return Object.values(this._all)
                },
                get bySkill() {
                    return this.skillCross.map(v=>this._all[v])
                }
            }
            //check which heroes are complete 
            let hC = ids.map(v=>false)
            const isComplete = ()=>{
                return hC.reduce((all,v)=>v && all, true)
            }

            //now get hero data 
            ids.forEach((hid,j)=>{
                outlandsXP.activeXP(hid).then(xp=>{
                    // xp = [total,available]
                    xp = xp.map(x => x.toNumber())
                    //now pull heroes 
                    outlandsHeroes.Heroes(hid).then(data=>{
                        if (heroes.counts[hid])
                            heroes.counts[hid]++;
                        else
                            heroes.counts[hid] = 0;
                        //data = [planeId,hash]
                        heroes._all[hid] = Object.assign({
                            stress: 0,
                            xp: 0
                        }, heroData(hid, data[0].toNumber(), data[1], xp))
                        hC[j] = true
                        //check for complete
                        if (isComplete()) {
                            resolve(heroes)
                        }
                    }
                    )
                }
                )
            }
            )
        }
        )
    }

    const pullChallengeLog = (bn,cid)=>{
        return new Promise((resolve,reject)=>{
            //check if completed 
            outlandsTrouble.completedChallenges(cid).then(isComplete=>{
                if (isComplete) {
                    resolve({
                        id: cid,
                        completed: isComplete
                    })
                } else {
                    //define log parse function 
                    const parse = (log)=>{
                        return outlandsTrouble.interface.parseLog(log)
                    }
                    //pull log 
                    logCheck(outlandsTrouble.address, ethers.utils.id("NewChallenge(bytes32,uint256,address,uint256,uint256[])"), bn).then(res=>{
                        if (res.length > 0) {
                            //find specific log 
                            let log = res.find(log=>{
                                //now pull data fron log 
                                let id = parse(log).values.id
                                return log.blockNumber == bn && id == cid
                            }
                            )
                            let vals = parse(log).values
                            //now get heroes 
                            getHeroDataForChallenge(vals.heroes.map(hid=>hid.toNumber())).then(heroes=>{
                                let challenge = planeTrouble(vals.period.toNumber(), vals.plane.toNumber())
                                challenge.id = cid
                                challenge.player = vals.player
                                //resolve with values
                                resolve({
                                    challenge,
                                    heroes
                                })
                            }
                            ).catch(console.log)
                        } else {
                            resolve({
                                id: cid,
                                notSubmitted: true
                            })
                        }
                    }
                    ).catch(console.log)

                }
            }
            ).catch(console.log)
        }
        )
    }

    // define the home page route
    router.get('/:id', function(req, res) {
        //run ping 
        ping()
        //respond
        let id = req.params.id

        //if the plane ide exists 
        eth.outlandsTrouble.currentPeriod().then(pd=>{
            period = pd.toNumber()
            res.json(planeTrouble(period, id))
        }
        )
    })
    // call for resolution 
    router.get('/resolve/:id.:bn', function(req, res) {
        //run ping 
        ping()
        //respond
        let {id, bn} = req.params
        //check if submitted 
        if (submitted.has(id)) {
            return res.json({
                id,
                submitted: true
            })
        }

        //get the challenge 
        pullChallengeLog(Number(bn), id).then(data=>{
            //check for completed
            if (data.completed)
                return res.json(data)
            //check for not sumbitted
            if (data.notSubmitted)
                return res.json(data)
                //work otherwise 
            else {
                let rC = resolveChallenge(data)
                //now update with reward 
                let overrides = {
                    // The price (in wei) per unit of gas - makes sure it is transmitted soon
                    gasPrice: eth.utils.parseUnits('20.0', 'gwei'),
                }
                //get required data from challenge result 
                let {player} = rC.challenge
                let {reward, hash, heroes, xp, cool} = rC
                //update reward to eth value 
                let reth = reward[1] + ".0"
                console.log(reth)
                let wei = eth.utils.parseEther(reth)
                reward[1] = wei.toString()
                //call reward
                outlandsTrouble.reward(id, player, reward, heroes, xp, hash, overrides).then(tx=>{
                    console.log("Challenge Reward Sent: " + tx.hash)
                    //set for short term
                    submitted.set(id, tx.hash)
                    rC.tx = tx.hash
                    //wait for tx - delete submitted 
                    eth.provider.waitForTransaction(tx.hash).then(data=>submitted.delete(id))
                    //resolve
                    res.json(rC)
                    //call cooldown 
                    outlandsTrouble.setCooldown(heroes, cool, overrides).catch(console.log)
                }
                ).catch(console.log)
            }
        }
        ).catch(console.log)
    })

    return router
}

module.exports = init
