const {planeTrouble} = require('./utilities');
const ethers = require('ethers');
const express = require('express');
const router = express.Router();

//ethers.utils.hexlify(ethers.utils.toUtf8Bytes('{"planeId":5}'))
//0x7b22706c616e654964223a357d
//ethers.utils.hexlify(ethers.utils.toUtf8Bytes('{"nextPeriod":true}'))
//0x7b226e657874506572696f64223a747275657d
const init = (eth,ping) => {
  // define the home page route
  router.get('/:id', function (req, res) {
    //run ping 
    ping()
    //respond
    let id = req.params.id
    let headers = req.headers

    //if the plane ide exists 
    eth.outlandsTrouble.currentPeriod().then(pd => {
      period = pd.toNumber()
      res.json(planeTrouble(period,id))
    }) 
  })

  return router
}

module.exports = init