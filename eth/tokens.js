const poll = (eth)=>{
  //count ticks 
  let tick = 0

  let app = eth.app
    , UI = app.UI.main
    , formatUnits = eth.utils.formatUnits
    , inventory = app.inventory
    , NFTs = inventory.NFTs;

  let CPX20 = null
    , GK = null
    , DM = null
    , CSM = null
    , address = ""
    , tokens = {};

  //decode an array of bignumber token ids and values 
    const tokenMapping = (ids,vals)=>{
      return ids.map((_id,i)=>{
        let id = _id.toNumber()
          , NFTId = getNFTId(id)
          , _t = NFTId ? T[NFTId] : T[id]
          , val = Number(this.utils.formatUnits(vals[i], _t.units));

        return {
          id,
          name: _t.name,
          _t,
          val,
          notify: "Recieved " + val + " " + _t.name
        }
      }
      )
    }

  const getStaking = ()=>{
    //check for free cosmic claim
    CSM.last_mint(eth.address).then(time=>{
      app.UI.staking.lastCPXClaim = time.toNumber()
    }
    )

    //check deposits 
    DM.getDeposit().then(deposit=>{
      DM.getMintAmount().then(_amt=>{
        let val = eth.utils.formatUnits(deposit.value, "ether")
        let amt = eth.utils.formatUnits(_amt, "ether")
        app.UI.staking.staked = [Number(val), Number(amt)]
      }
      )
    }
    )
  }

  const getBalanceOfNFT = ()=>{
    NFTs.forEach(nft=>{
      let id = nft[0]
        , start = nft[1].range[0]
        , T = tokens[id];

      //first get the count 
      GK.countOfNFT(id).then(res=>{
        let count = res.toNumber()
        //create an array and check balances
        let _ids = Array.from({
          length: count
        }, (v,i)=>start + 1 + i)
          , _accounts = _ids.map(id=>address);

        GK.balanceOfBatch(_accounts, _ids).then(bal => {
          //reset token id array
          T.ids = [] 
          //identify which belong to player 
          bal.forEach((b,i) => {
            if(b.toNumber() > 0) T.ids.push(_ids[i])
          })

          //update UI
          Vue.set(UI.tokens, id, T)
        })    
      }
      )
    }
    )
  }

  const getBalanceOfTokens = ()=>{
    //reset token balances 
    Object.assign(tokens, inventory.tokens)

    //data for function call 
    let _ids = Object.keys(inventory.tokens)
      , _accounts = _ids.map(id=>address);

    GK.balanceOfBatch(_accounts, _ids).then(bal=>{
      //loop through each balance 
      bal.forEach((b,i)=>{
        let _T = tokens[_ids[i]]
        _T._val = b
        //format units
        _T.val = Number(formatUnits(b, _T.units))

        //set ui 
        Vue.set(UI.tokens, _ids[i], _T)
      }
      )
    }
    )

    //get balance of Cosmic 
    CPX20.balanceOf(address).then(bal=>Vue.set(UI.tokens, 0, eth.utils.formatUnits(bal, "ether")))
  }

  return (Contracts)=>{
    //tick 
    tick++

    //set Contracts 
    GK = Contracts.Gatekeeper
    CPX20 = Contracts.CPXToken20
    DM = Contracts.DiamondMinter
    CSM = Contracts.CPXSimpleMinter
    address = eth.address

    //every 5 seconds
    if ((tick % 2 * 5) == 0) {
      getBalanceOfTokens()
      getBalanceOfNFT()

      //staking 
      if (UI.show == "staking")
        getStaking()
    }
  }
}

export {poll}
