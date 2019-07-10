const {heroData} = require('./utilities');
var express = require('express')
var router = express.Router()

const init = (eth,ping)=>{
    // define the home page route
    router.get('/:hid', function(req, res) {
        //run ping 
        ping()
        //respond
        let params = req.params
        let id = Number(params.hid)

        //provides owner
        eth.outlandsHeroes.ownerOf(id).then((owner)=>{
            //pull xp 
            eth.outlandsXP.activeXP(id).then(xp=>{
                // xp = [total,available]
                xp = xp.map(x=>x.toNumber())
                //now pull heroes 
                eth.outlandsHeroes.Heroes(id).then(data=>{
                    let hero = heroData(id, data[0].toNumber(), data[1], xp)
                    hero.owner = owner
                    res.json(hero)
                }
                )
            }
            )
        }
        )
    })

    return router
}

module.exports = init
