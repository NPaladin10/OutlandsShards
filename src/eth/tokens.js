const poll = (eth)=>{
  //count ticks 
  let tick = 0

  let app = eth.app,
    formatUnits = eth.utils.formatUnits,
    inventory = app.inventory,
    NFTs = inventory.NFTs;

  let GK = null, address = "", tokens = {};

  const getBalanceOfNFT = () => {
    NFTs.forEach(nft => {
      let id = nft[0],
        start = nft[1].range[0];
      //first get the count 
      GK.getCountOfNFT(id).then(res => {
        let count = res[0].toNumber()
        //create an array and check balances
        let _ids = Array.from({length: count}, (v, i) => start+1+i),
          _accounts = _ids.map(id => address);
        
        //GK.balanceOfBatch(_accounts, _ids).then(bal => {})    
      })
    })
  }

  const getBalanceOfTokens = () => {
    //reset token balances 
    Object.assign(tokens,inventory.tokens)

    //data for function call 
    let _ids = Object.keys(inventory.tokens),
      _accounts = _ids.map(id => address);

    GK.balanceOfBatch(_accounts, _ids).then(bal => {
      //loop through each balance 
      bal.forEach((b,i) => {
        let _T = tokens[_ids[i]] 
        _T._val = b
        //format units
        _T.val = Number(formatUnits(b, _T.units)) 
      })
    })
  }

  return (_gk) => {
    //tick 
    tick++
    //set Gatekeeper 
    GK = _gk
    address = eth.address

    //every 5 seconds
    if((tick % 2*5) == 0) {
      getBalanceOfTokens()
      getBalanceOfNFT()
    }
  }
}

export {poll}
