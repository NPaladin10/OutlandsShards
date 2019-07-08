var express = require('express')
var router = express.Router()

const init = (eth) => {
  // define the home page route
  router.get('/:hid', function (req, res) {
    let params = req.params
    let id = Number(params.hid)
    let headers = req.headers

    eth.outlandsHeroes.ownerOf(id).then((owner) => {
      eth.outlandsHeroes.Heroes(id).then(data => {
        res.json({
          id,
          owner : owner,
          pid : data[0].toNumber()
        })
      })
    })
  })  

  return router
}

module.exports = init