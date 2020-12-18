const poll = (eth)=>{
  //count ticks 
  let tick = 0

  let app = eth.app
    , UI = app.UI.main
    , signer = eth.signer
    , Contracts = null;

  //get when daily treasure was claimed 
  eth.dailyTreasureTime = () => {
    let lT = Contracts.DailyTreasure.lastTreasure

    for(let i = 0; i < 3; i++) {
      //call to see when claimed 
      lT(eth.address, i).then(t => {
        //set ui 
        Vue.set(app.UI.dailyTreasure.lastClaim, i, t.toNumber())
      })
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
  const pollAdmin = () => {
    let adminRole = "0x0000000000000000000000000000000000000000000000000000000000000000"
    //check for admin 
    Object.entries(Contracts).forEach(e=>{
      let name = e[0]
        , C = e[1];

      if (C.hasRole) {
        //check role 
        C.hasRole(adminRole, eth.address).then(_isAdm=>{
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
  const getAddress = ()=>{
    signer.getAddress().then(address=>{
      //do something on change 
      if (address != eth.address) {
        //update address
        eth.address = UI.address = address
        //clear admin 
        UI.isAdmin = []

      }
    }
    )
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
      if(eth.address != "") {
        pollAllowance()
        pollAdmin()
      } 
    }
    if (UI.show == "daily" && tick % 120 == 0) {
      eth.dailyTreasureTime()
    }

  }
}

export {poll}
