const {planeTrouble} = require('./utilities');
const ethers = require('ethers');
const express = require('express');
const router = express.Router();

//ethers.utils.hexlify(ethers.utils.toUtf8Bytes('{"planeId":5}'))
//0x7b22706c616e654964223a357d
//ethers.utils.hexlify(ethers.utils.toUtf8Bytes('{"nextPeriod":true}'))
//0x7b226e657874506572696f64223a747275657d
const init = (eth) => {
  // define the home page route
  router.get('/:id', function (req, res) {
    let id = req.params.id
    let headers = req.headers

    //if the plane ide exists 
    eth.outlandsTrouble.currentPeriod().then(pd => {
      period = pd.toNumber()
      res.json(planeTrouble(period,id))
    }) 
  })
  // define raw transaction
  router.get('/tx/:data', function (req, res) {
    let data = JSON.parse(ethers.utils.toUtf8String(req.params.data))
    let headers = req.headers

    //if the plane ide exists 
    if(data.planeId) {
      eth.outlandsTrouble.currentPeriod().then(pd => {
        period = pd.toNumber()

        res.json(planeTrouble(period,data.planeId))
      }) 
    }
    else if(data.nextPeriod) {
      let overrides = {
        // The price (in wei) per unit of gas
        gasPrice: ethers.utils.parseUnits('5.0', 'gwei')
      };
      eth.outlandsTrouble.nextPeriod().then(tx => {
        console.log("Next period: "+tx.hash)
      })
    }
  })

  return router
}

module.exports = init