import {TOKENS} from "./tokenlist.js"

const poll = (app) => {
  let UI = app.UI.main

  const updateTokens = () => {
    let balanceOf = app.gatekeeper.balanceOf

    Object.entries(TOKENS).forEach(e => {
      let id = e[0]
        , _token = e[1];

      _token.val = balanceOf(id)

      Vue.set(UI.tokens, id, _token)
    })
  }

  //return polling function 
  let tick = 0
  return ()=>{
    //tick 
    tick++
    //every 2 seconds
    if(tick % 4 == 0){
      //set ui 
      updateTokens()
    }
  }

}

const Gatekeeper = (app)=>{
  const ID_NFT = 0;

  //core token data 
  let _tokens = {}
    , _countOfNFT = {}
    , _stats = {};

  //quick links 
  let notify = app.simpleNotify

  /*
    minting and burning
  */

  const _mint = (id,val)=>{
    //handle minting
    if (!_tokens[id]) {
      //if the token doesn't exist
      _tokens[id] = val
    } else {
      _tokens[id] += val
    }
  }

  //covers minting 
  // list is an array of [id,#]
  const mint = (list)=>{
    //loops through provided ids 
    for (let i = 0; i < list.length; i++) {
      _mint(...list[i])
    }
  }

  //covers minting of nft 
  const mintNFT = (nft)=>{
    //keeps track of total count 
    if (!_countOfNFT[nft]) {
      _countOfNFT[nft] = 1
    } else {
      _countOfNFT[nft] += 1
    }

    //determine id 
    let id = nft + _countOfNFT[nft]

    //set stats 
    _stats[id] = {}
    _stats[id][ID_NFT] = nft 

    //mint 
    _mint(id, 1)

    return id
  }

  const _burnCheck = (list) => {
    let id, val;

    //loops through provided ids 
    for (let i = 0; i < list.length; i++) {
      id = list[i][0]
      val = list[i][1]

      if (!_tokens[id]) {
        notify("Token does not exist.", "error")
        return false
      }
      if (_tokens[id] < val) {
        notify("Not enough of the token.", "error")
        return false
      }
    }

    return true
  }

  // list is an array of [id,#]
  const burn = (list)=>{
    if(!_burnCheck(list)) return false

    let id, val;
    //loops through provided ids 
    for (let i = 0; i < list.length; i++) {
      id = list[i][0]
      val = list[i][1]

      //burn 
      _tokens[id] -= val

      //check for NFT
      if (_stats[id]) {
        delete _stats[id]
      }
    }

    return true 
  }

  const balanceOf = (id)=>{
    return _tokens[id] ? _tokens[id] : 0 
  }

  /*
    handle stats 
  */
  const setStats = (id,sids,vals)=>{
    //loop and set 
    for (let i = 0; i < sids.length; i++) {
      _stats[id][sids[i]] = vals[i]
    }
  }

  const modStats = (id,sids,vals)=>{
    let stat;
    //loop and set 
    for (let i = 0; i < sids.length; i++) {
      if (!_stats[id][sids[i]]) {
        _stats[id][sids[i]] = vals[i]
      } else {
        _stats[id][sids[i]] += vals[i]
      }
    }
  }

  const getStats = (id,sids)=>{
    return sids.map(si=> _stats[id][si])
  }

  //core gatekeeper functions
  app.gatekeeper = {
    mint,
    mintNFT,
    burn,
    balanceOf,
    countOfNFT : _countOfNFT,
    setStats,
    modStats,
    getStats,
    poll: poll(app)
  }

  //server-like calls 
  app.server.balanceOf = balanceOf
  app.server.countOfNFT = _countOfNFT
  app.server.getStats = getStats
}

export {Gatekeeper}
