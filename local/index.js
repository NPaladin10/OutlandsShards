import*as Hooks from "./hooks.js"
import {Gatekeeper} from "./gatekeeper.js"
import {RarityManager} from "./rarity.js"
import {ShardManager} from "./shards.js"
import {Storefront} from "./storefront.js"
import {Characters} from "./characters.js"
import {DailyTreasure} from "./dailyTreasure.js"

const LocalServer = (app)=>{

  //setup sever-like interaction object 
  app.server = {
    calls: {}
  }
  app.mint = {}
  app.generate = {}

  //call sub workers
  Gatekeeper(app)
  RarityManager(app)
  ShardManager(app)
  Storefront(app)
  Characters(app)
  DailyTreasure(app)

  //register calls for hooks 
  Hooks.RegisterCalls(Object.keys(app.server.calls))

  //manage polling 
  let tick = 0
  app.server.poll = ()=>{
    //every 10 seconds
    if (tick % 20 == 0) {
      for (let x in app.server) {
        //check for poll 
        if (app.server[x].poll)
          app.server[x].poll()
      }
    }
    tick++
  }

  //check signature
  app.checkSignature = (callData)=>{
    //first check sig 
    let signer = app.eth.utils.verifyMessage(JSON.stringify(callData.data), callData.signed)
    return signer == callData.player
  }

  //create a async submit function for use in app 
  app.submit = async(callId,data)=>{
    let calls = app.server.calls
    data = data || {}

    //create package to send 
    let callData = {
      player: app.player,
      data: data,
      signed: await app.eth.signer.signMessage(JSON.stringify(data))
    }

    /*
      server side functions 
    */

    //check Signature
    if (!app.checkSignature(callData)) {
      //reject
      return Promise.reject({
        call,
        success: false,
        reason: "Signature does not match."
      })
    }

    //make call 
    if (calls[callId]) {
      //call pre hooks - modify data construct 
      Hooks.RunPreHooks(callId, callData)

      //make call 
      let callReturn = await calls[callId](callData)
      callReturn.call = callId
      callReturn.pre = callData

      //if successful call 
      if (callReturn.success) {
        //call call post hooks - modify data construct 
        Hooks.RunPostHooks(callId, callReturn)
        //delete pre data 
        delete callReturn["pre"]

        //return call data 
        return callReturn
      } else {
        //reject 
        return Promise.reject(callReturn)
      }
    } else {
      //reject
      return Promise.reject({
        call,
        success: false,
        reason: "No such call."
      })
    }

  }

  //app.server.gatekeeper.mint(app.player, [["dmd",100]])
}

export {LocalServer}
