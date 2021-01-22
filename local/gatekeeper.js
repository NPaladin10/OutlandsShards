import {TOKENS, NFT} from "../data/tokenlist.js"

const ID_OWNER = "own" 

//setup stores for tokens and stats
const DB_TOKENS = localforage.createInstance({
  name: "Shards",
  storeName: "Tokens"
})
const DB_STATS = localforage.createInstance({
  name: "Shards",
  storeName: "Stats"
})
const DB_OWNERS = localforage.createInstance({
  name: "Shards",
  storeName: "Owners"
})
const DB_DEPLOYED = localforage.createInstance({
  name: "Shards",
  storeName: "Deployed"
})

const Gatekeeper = (app)=>{
  //initiate state 
  app.DB.getItem("nfts").then(res=>{
    if (!res)
      app.DB.setItem("nfts", {})
  }
  )

  //initiate tokens for a player 
  const initTokens = (player)=>{
    let tokens = {}
    //set initial values to 0 
    Object.entries(TOKENS).forEach(e=>tokens[e[0]] = 0)

    //db id 
    DB_TOKENS.setItem(player, tokens)
    return tokens
  }

  /*
    minting and burning
  */

  const _mint = (_tokens,id,val)=>{
    //handle minting
    if (!_tokens[id]) {
      //if the token doesn't exist
      _tokens[id] = val
    } else {
      _tokens[id] += val
    }

    return _tokens[id]
  }

  //covers minting 
  // list is an array of [id,#]
  const mint = async(player,list)=>{
    //pull tokens from db 
    let _tokens = await DB_TOKENS.getItem(player) || initTokens(player)

    //loops through provided ids 
    let _vals = [];
    for (let i = 0; i < list.length; i++) {
      _vals.push(_mint(_tokens, ...list[i]))
    }

    //save
    DB_TOKENS.setItem(player, _tokens)
    return _vals
  }

  //check if NFT is deployed to ETH
  const isDeployed = async(id)=>{
    let allIDs = await DB_DEPLOYED.keys()
    return allIDs.includes(id)
  }

  //get owner of NFT 
  const getOwner = async(id)=>{
    let _isDeployed = await isDeployed(id)
    let stats = await DB_STATS.getItem(id)
    return stats[ID_OWNER]
  }

  //check for ownership
  const isOwnerOf = async(player,id)=>{
    let _isDeployed = await isDeployed(id)
    let _tokens = await DB_TOKENS.getItem(player)
    return _tokens[id] == 1  
  }

  //check if NFT exists
  const nftExists = async(id)=>{
    let stats = await DB_STATS.getItem(id)
    return stats ? true : false
  }

  //covers minting of nft 
  const mintNFT = async(player,nft,id)=>{
    //pull tokens from db 
    let _tokens = await DB_TOKENS.getItem(player) || initTokens(player)

    //mint 
    _mint(_tokens, id, 1)

    //save
    DB_TOKENS.setItem(player, _tokens)
    //set stats 
    let stats = {}
    stats[ID_OWNER] = player
    DB_STATS.setItem(id, stats)

    //get count and update 
    let counts = await app.DB.getItem("nfts")
    counts[nft] = counts[nft] ? counts[nft]+1 : 1
    //set 
    app.DB.setItem("nfts", counts)

    return 1
  }

  const _burnCheck = (_tokens,list)=>{
    let id, val;

    //loops through provided ids 
    for (let i = 0; i < list.length; i++) {
      id = list[i][0]
      val = list[i][1]

      if (!_tokens[id]) {
        return false
      }
      if (_tokens[id] < val) {
        return false
      }
    }

    return true
  }

  // list is an array of [id,#]
  const burn = async(player,list)=>{
    let nfts = await app.DB.getItem("nfts")
    //pull tokens from db 
    let _tokens = await DB_TOKENS.getItem(player)

    if (!_tokens)
      return false

    if (!_burnCheck(_tokens, list))
      return false

    let id, val;
    //loops through provided ids 
    for (let i = 0; i < list.length; i++) {
      id = list[i][0]
      val = list[i][1]

      //burn 
      _tokens[id] -= val

      //check for NFT
      if (id.includes(".")) {
        let nftid = id.split(".").slice(0, 2).join(".")
        nfts[nftid] -= 1
        //remove stats 
        DB_STATS.removeItem(id)
      }
    }

    //set 
    DB_TOKENS.setItem(player, _tokens)
    app.DB.setItem("nfts", nfts)

    return true
  }

  const allTokens = async(player)=>{
    return await DB_TOKENS.getItem(player) || {}
  }

  const balanceOf = async(player,id)=>{
    let tokens = await DB_TOKENS.getItem(player)
    return tokens[id] ? tokens[id] : 0
  }

  const balanceOfNFT = async(_nft)=>{
    let nfts = await app.DB.getItem("nfts")
    return nfts[_nft]
  }

  /*
    handle stats 
  */
  const getAllStats = async(id) => {
    return await DB_STATS.getItem(id) || {}
  }

  const setStats = async(id,sids,vals) =>{
    //pull stats 
    let _stats = await getAllStats(id)

    //loop and set
    sids.forEach((si, i) => {
      _stats[si] = vals[i]
    }) 

    //set 
    await DB_STATS.setItem(id, _stats)
    return true
  }

  const modStats = async(id,sids,vals)=>{
    //pull stats 
    let _stats = await getAllStats(id)

    //loop and set
    sids.forEach((si, i) => {
      _stats[si] = typeof(_stats[si]) == "undefined" ? vals[i] : _stats[si] + vals[i] 
    }) 

    //set 
    await DB_STATS.setItem(id, Object.assign({},_stats))
    return true
  }

  const getStats = async(id,sids)=>{
    let stats = await DB_STATS.getItem(id) || {}
    return sids.map(si=>stats[si] ? stats[si] : 0)
  }

  /*
    Poll
  */
  const poll = ()=>{}

  //core gatekeeper functions
  app.server.gatekeeper = {
    poll,
    mint,
    mintNFT,
    burn,
    nftExists,
    balanceOf,
    getOwner,
    isOwnerOf,
    setStats,
    modStats,
    getStats,
    getAllStats,
    allTokens
  }

  //server calls 
  app.server.calls.balanceOfNFT = async(call)=>{
    return {
      success: true,
      data: await balanceOfNFT(call.data.nft)
    }
  }
  app.server.calls.allTokens = async(call)=>{
    return {
      success: true,
      data: await allTokens(call.player)
    }
  }
  app.server.calls.getStats = async(call)=>{
    let {id, sids} = call.data

    return {
      success: true,
      data: await getStats(id, sids)
    }
  }
  app.server.calls.nftExists = async(call)=>{
    let {id} = call.data

    return {
      success: true,
      data: await nftExists(id)
    }
  }
}

export {Gatekeeper}
