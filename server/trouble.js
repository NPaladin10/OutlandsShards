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

//Challenge Resolution based upon pulled data 
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
    //check to give xp 
    const giveXP = (h, D) => {
        if(D >= h.r && h.xp == 0) {
            //get hp at rank - round up 
            h.xp = Math.ceil(Math.pow(10, h.r) / 20)
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
        //roll + bonus 
        //Want the result to be 0 or greater 
        let R = (dF(rng) + h.skillsById[s] + AB) - (D + dF(rng))
        allR.push(R)
        //check for result 
        if (R < 0) {
            h.stress += -R
            //give xp - compare D to hero rank 
            giveXP(h,D)
        } else if (R == 0) {
            h.stress += 1
            //give xp - compare D to hero rank 
            giveXP(h,D)
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
        //previous exp 
        _xp: heroes.all.map(h=>h._xp[1]),
        //if complete - all skills overcome 
        res: skills.length == 0,
        xp: heroes.all.map(h=>h.xp),
        //no cool for no stress - every stress gives another 
        cool: heroes.all.map(h=>{
            let now = Date.now() / 1000
            let nc = now + (h.stress * challenge.sCool)
            return nc.toFixed()
        }
        ),
        reward: skills.length == 0 ? reward : [0, 0]
    }
}

const init = (eth,ping)=>{
    //get contracts and functions 
    let {utils, OutlandsToken, OutlandsRegistry, outlandsTrouble, outlandsXP, logCheck, signData} = eth

    /*
        Functions to pull the data 
    */

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
                    xp = xp.map(x=>x.toNumber())
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

    const pullChallengeLog = (bn,id)=>{
        return new Promise((resolve,reject)=>{
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
                        return log.blockNumber == bn && id == parse(log).values.id
                    }
                    )
                    //ensure the log exists 
                    if (!log)
                        reject("No data in block.")
                    //set values
                    let vals = parse(log).values
                    //pull cooldown value - time required between points of stress 
                    outlandsTrouble.coolPerStress().then(sCool => {
                        //now get heroes 
                        getHeroDataForChallenge(vals.heroes.map(hid=>hid.toNumber())).then(heroes=>{
                            let challenge = planeTrouble(vals.period.toNumber(), vals.plane.toNumber())
                            challenge.sCool = sCool.toNumber()
                            challenge.id = id
                            challenge.player = vals.player
                            //resolve with values
                            resolve({
                                challenge,
                                heroes
                            })
                        }
                        ).catch(console.log)
                    })
                } else {
                    resolve({
                        id: id,
                        notSubmitted: true
                    })
                }
            }
            ).catch(console.log)

        }
        ).catch(console.log)
    }

    /*
        PAGE ROUTERS
    */

    // define the home page route
    router.get('/:id', function(req, res) {
        //run ping 
        ping()
        //respond
        let id = req.params.id

        //if the plane id exists 
        eth.outlandsTrouble.currentPeriod().then(pd=>{
            period = pd.toNumber()
            //provide trouble data
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

        outlandsTrouble.completedChallenges(id).then(isComplete=>{
            //check if completed 
            if (isComplete) {
                return res.json({
                    id: id,
                    completed: isComplete
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
                    let {player, plane} = rC.challenge
                    let {reward, hash, heroes, _xp, xp, cool} = rC
                    //update reward to eth value 
                    let reth = reward[1].toFixed(2)
                    let wei = eth.utils.parseEther(reth)
                    reward[1] = wei.toString()
                    //call complete 
                    //function complete(bytes32 id, bytes32 hash, address player, uint256[2] cpx, uint256[] heroes, uint256[] xp, uint256[] pxp, uint256[] cool)
                    outlandsTrouble.complete(plane, id, hash, player, reward, heroes, xp, _xp, cool, overrides).then(tx=>{
                        console.log("Challenge Reward Sent: " + tx.hash)
                        //set for short term
                        submitted.set(id, tx.hash)
                        rC.tx = tx.hash
                        //wait for tx - delete submitted 
                        eth.provider.waitForTransaction(tx.hash).then(data=>submitted.delete(id))
                        //resolve
                        res.json({
                            hash,
                            reward,
                            //notify of xp - consolation for fail
                            xp : heroes.map((hi,i) => [hi,xp[i]])
                        })
                    }
                    ).catch(console.log)
                }
            }
            ).catch(console.log)
        }
        )
    })
    // call for test resolution 
    router.get('/testResolve/:hex', function(req, res) {
        //reverse the - ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(data)))
        let payload = JSON.parse(utils.toUtf8String(req.params.hex))
        let {address,data,sig} = payload 
        //validate 
        if(address != ethers.utils.verifyMessage(JSON.stringify(data),sig)) {
            return res.json({err:'Invalid Signature'})
        }
        //check valid ownership
        OutlandsRegistry.ownerOfBatch(data.heroIds).then(owners => {
            let mayContinue = owners.reduce((mayC,id) => mayC && address == id,true)
            //ensure ownership
            if(!mayContinue) return res.json({err:'Does not own all tokens'})
            //check cooldown
            //run result 
            res.json({
                data,owners
            })
        })
    })

    return router
}

module.exports = init
