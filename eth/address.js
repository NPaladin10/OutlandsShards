const ROLE_ADMIN = "0x0000000000000000000000000000000000000000000000000000000000000000"

const TOKENS = {
  "eth": {
    "name": "ETH",
    "units": "ether"
  }
}

const poll = (app,eth)=>{
  //count ticks 
  let tick = 0

  let UI = app.UI.main, signer, Contracts;

  //decode an array of bignumber token ids and values 
  const tokenMapping = (id,val)=>{
    let T = TOKENS[id]

    return {
      id,
      name: T.name,
      val: Number(eth.utils.formatUnits(val, TOKENS[id].units))
    }
  }

  //get when daily treasure was claimed 
  eth.dailyTreasureTime = ()=>{
    let lT = Contracts.DailyTreasure.lastTreasure

    for (let i = 0; i < 3; i++) {
      //call to see when claimed 
      lT(eth.address, i).then(t=>{
        //set ui 
        Vue.set(app.UI.dailyTreasure.lastClaim, i, t.toNumber())
      }
      )
    }
  }

  //check allowances of contracts
  const pollAllowance = ()=>{
    //check for approval
    Contracts.CPXToken1155.isApprovedForAll(eth.address, Contracts.Gatekeeper.address).then(approved=>{
      if (approved && !UI.approval.includes("Gatekeeper")) {
        UI.approval.push("Gatekeeper")
      }
    }
    )

    //check for allowance
    Contracts.CPXToken20.allowance(eth.address, Contracts.DiamondMinter.address).then(allowance=>{
      Vue.set(UI.allowance, "DiamondMinter", Number(eth.utils.formatUnits(allowance, "ether")))
    }
    )
  }

  //view whether address has admin role 
  const pollAdmin = ()=>{
    //check for admin 
    Object.entries(Contracts).forEach(e=>{
      let name = e[0]
        , C = e[1];

      if (C.hasRole) {
        //check role 
        C.hasRole(ROLE_ADMIN, eth.address).then(_isAdm=>{
          //push the contract to the list 
          if (_isAdm && !UI.isAdmin.includes(name))
            UI.isAdmin.push(name)
        }
        )
      }
    }
    )
  }

  //poll address
  const getAddress = async()=>{
    let address = await signer.getAddress()

    //do something on change 
    if (address != eth.address) {
      //update address
      eth.address = UI.address = address
      //clear admin 
      UI.isAdmin = []
    }

    //set tokens 
    let bal = await signer.getBalance()
    let tid = ["goerli"].includes(eth.net) ? "eth" : "" 
    Vue.set(UI.tokens,"0",tokenMapping(tid, bal))

    if (address != "") {
      pollAdmin()
    }
  }

  return ()=>{
    //tick 
    tick++

    //signer 
    signer = eth.signer
    Contracts = eth.contracts

    //every 2 seconds
    if (tick % 4 == 0) {
      getAddress()
    }
    if (UI.show == "daily" && tick % 120 == 0) {//eth.dailyTreasureTime()
    }

  }
}

export {poll}
