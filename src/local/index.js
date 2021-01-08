import {Gatekeeper} from "./gatekeeper.js"
import {RarityManager} from "./rarity.js"
import {ShardManager} from "./shards.js"
import {Storefront} from "./storefront.js"
import {Characters} from "./characters.js"
import {TreasureMinter} from "./treasure.js"

const LocalServer = (app) => {

  app.constants.ZeroByte = "0x0000000000000000000000000000000000000000000000000000000000000000"

  app.utils.hexToNumber = (hex,start,stop)=>{
    let slice = hex.slice(2).slice(start * 2, stop * 2)
    return parseInt(slice, 16)
  }

  //setup sever-like interaction object 
  app.server = {}

  //call sub workers
  Gatekeeper(app)
  RarityManager(app)
  ShardManager(app)
  Storefront(app)
  Characters(app)
  TreasureMinter(app)

  app.server.poll = () => {
    app.gatekeeper.poll()
    app.shards.poll()
    app.characters.poll()
  }

  //for practice
  app.gatekeeper.mint([[1,100]])
}

export {LocalServer}