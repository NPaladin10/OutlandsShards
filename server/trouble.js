const {planeTrouble, heroData, arrayUnique} = require('./utilities');
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

//check if the player can complete the challenge
const mayCompleteChallenge = async(player,planeId,OutlandsTrouble)=>{
    let check = await OutlandsTrouble.mayCompleteCheck(planeId,player)
    return {
        mayComplete: check.mayComplete,
        period: check.period.toNumber(),
        coolPerStress: check.cool.toNumber()
    }
}

//pull hero data from chain
const getHeroDataForChallenge = async(ids,getHeroData)=>{
    let uids = arrayUnique(ids)
    let data = await getHeroData(uids)
    //setup return 
    let heroes = {
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
    //build 
    uids.forEach((hid,i)=>{
        heroes._all[hid] = Object.assign({
            xp: 0,
            stress: 0,
            cool: data.cool[i]
        }, heroData(hid, data.planes[i], data.blocks[i], data.xp[i]))
    }
    )
    //return heroes
    return heroes
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
    const giveXP = (h,SB,D)=>{
        if (D >= SB && h.xp == 0) {
            //get hp at skill bonus rank - round up 
            h.xp = Math.ceil(Math.pow(10, SB) / 20)
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
        let skillB = h.skillsById[s] + AB
        //roll + bonus 
        //Want the result to be 0 or greater 
        let R = (dF(rng) + skillB) - (D + dF(rng))
        allR.push(R)
        //check for result 
        if (R < 0) {
            h.stress += -R
            //give xp - D to skill bonus
            giveXP(h,skillB,D)
        } else if (R == 0) {
            h.stress += 1
            //give xp - compare D to skill bonus 
            giveXP(h,skillB,D)
            //remove the skill - it is complete 
            skills.shift()
            approaches.shift()
            //give points 
            points += Math.pow(10,D-skillB)
        } else {
            //remove the skill - it is complete 
            skills.shift()
            approaches.shift()
            //give points 
            points += Math.pow(10,D-skillB)
        }
    }
    //check for reward - Diamond or a color 
    let reward = [rng.weighted([0, challenge.approachId + 1], [2, 3]), Math.pow(2, D)]
    //return result
    let now = Date.now() / 1000
    return {
        allR,
        challenge,
        hash,
        points : Math.round(points),
        //keep skill cross
        hBySkill : heroes.skillCross,
        heroes: heroes.all.map(h=>h.id),
        //previous exp 
        _xp: heroes.all.map(h=>h._xp),
        //if complete - all skills overcome 
        res: skills.length == 0,
        xp: heroes.all.map(h=>h.xp),
        //no cool for no stress - every stress gives another 
        now,
        cool: heroes.all.map(h=>{
            let nc = now + (h.stress * challenge.sCool)
            return nc.toFixed()
        }
        ),
        reward: skills.length == 0 ? reward : [0, 0]
    }
}

//Runs all the pre checks for a challenge and then resolves 
const challengeChecksAndResolve = async(payload,eth)=>{
    let {OutlandsRegistry, OutlandsTrouble, getHeroData} = eth
    let {address, data, sig} = payload
    //validate 
    if (address != ethers.utils.verifyMessage(JSON.stringify(data), sig)) {
        return {
            err: 'Invalid Signature'
        }
    }
    //check valid ownership
    let owners = await OutlandsRegistry.ownerOfBatch(data.heroIds)
    let mayContinue = owners.reduce((mayC,id)=>mayC && address == id, true)
    //ensure ownership
    if (!mayContinue) {
        return {
            err: 'Does not own all tokens'
        }
    }
    //check may complete 
    let mayComplete = await mayCompleteChallenge(address,data.planeId,OutlandsTrouble)
    if (!mayComplete.mayComplete) {
        return {
            err: 'Challenge is already complete'
        }
    }
    //pull challenge 
    let challenge = planeTrouble(mayComplete.period, data.planeId)
    challenge.sCool = mayComplete.coolPerStress
    challenge.player = address
    //check check status
    let heroes = await getHeroDataForChallenge(data.heroIds,getHeroData)
    //resolve
    return resolveChallenge({
        challenge,
        heroes
    })
}

const init = (eth,ping)=>{
    //get contracts and functions 
    let {utils,OutlandsTrouble,CosmicRegistry} = eth

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

    })
    // call for test resolution 
    router.get('/testResolve/:hex', function(req, res) {
        //reverse the - ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(data)))
        let payload = JSON.parse(utils.toUtf8String(req.params.hex))
        //Run through check and solve 
        challengeChecksAndResolve(payload,eth).then(cRes => {
            let {address, data, sig} = payload
            let {planeId, heroIds} = data 
            let {challenge, points, reward, _xp, hash} = cRes
            //ethereum pack the result 
            let toBytes = {
                address,
                period : challenge.period,
                planeId,
                heroes : heroIds,
                _xp,
                hash
            }
            //develop bytes response to laod in log 
            let bytesRes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(toBytes)))

            //now commit 
            let overrides = {
                gasLimit: 500000,
                gasPrice: utils.parseUnits('5.0', 'gwei'),
            }
            //send a reward if there is one 
            if(reward[1] != 0) {
                //change to eteher value 
                let val = utils.parseUnits(reward[1].toFixed(1), 'ether')
                CosmicRegistry.mint(reward[0],[address],[val],overrides).then(t=> {
                    console.log("Complete Challenge Reward transaction sent: "+t.hash)    
                })
                .catch(console.log)   
            }

            //complete(address player, uint256 period, uint256 planeId, uint256 points, uint256[] memory ids, uint256[] memory xp, uint256[] memory cool, bytes memory res)
            OutlandsTrouble.complete(address, challenge.period, planeId, points, cRes.heroes, cRes.xp, cRes.cool, bytesRes,overrides).then(t => {
                console.log("Complete Challenge transaction sent: "+t.hash)
                //create payload for player 
                let toPlayer = Object.assign({
                    points, 
                    xp : cRes.xp, 
                    reward,
                    tx: t.hash
                },toBytes)
                //send data 
                res.json(toPlayer)
            })
            .catch(console.log)   
        })
    })

    return router
}

module.exports = init
