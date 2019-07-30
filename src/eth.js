//get the new data in Set B 
const setCheckForNewData = (A,B) => {
  if(!B) return []
  let bArr = [...B.values()]
  return bArr.reduce((newIds,id)=>{
    if(!A.has(id)) newIds.push(id);
    return newIds
  },[])
} 

const addressFromTopic = (id, topic) => {
    return ethers.utils.getAddress(ethers.utils.hexStripZeros(topic[id])) 
}

const toHexString = (obj) => {
    return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(obj)))
}

/* Contract Data 
*/

let CPXContracts = {
  OutlandsToken : {
    abi : [
      "event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)",
      "event URI(string _value, uint256 indexed _id)",
      "function ownerOf(uint256 _id) public view returns (address)",
      "function balanceOf(address _owner, uint256 _id) external view returns (uint256)",
      "function isApprovedForAll(address _owner, address _operator) external view returns (bool)",
      "function getNonFungibleIndex(uint256 _id) public pure returns(uint256)",
      "function getNonFungibleBaseType(uint256 _id) public pure returns(uint256)"
    ],
    //kovan - 0x303435cf43478b61F25D6fa8909a7418E1b6E3Ec
    address : "0x20a2F9E30bdecAFfdc7B9571FF7CAC585D054014",
    tokenTypeIds : {
      "57896044618658097711785492504343953926975274699741220483192166611388333031424" : "plane",
      "plane" : "57896044618658097711785492504343953926975274699741220483192166611388333031424",
      "hero" : "57896044618658097711785492504343953927315557066662158946655541218820101242880",
      "57896044618658097711785492504343953927315557066662158946655541218820101242880" : "hero",
      "crew" : "57896044618658097711785492504343953927655839433583097410118915826251869454336",
      "57896044618658097711785492504343953927655839433583097410118915826251869454336" : "crew"            
    }
  },
  OutlandsRegistry : {
    abi : [
      "event NewPlane (address indexed player, uint256 i)",
      "event NewHero (address indexed player, uint256 i, uint256 plane)",
      "event NewUnit (address indexed player, uint256 i, uint256 plane, bytes32 hash)",
      "event FundsWithdrawn (address indexed who, uint256 amt)",
      "function cost(uint256) public view returns(uint256)",
      "function shareToOwner(uint256) public view returns(uint256)",
      "function timeBetween(uint256) public view returns(uint256)",
      "function nextTimePlayer(address) public view returns(uint256)",
      "function nextTimePlane(uint256) public view returns(uint256)",
      "function fundsReceived(address) public view returns(uint256)",
      "function getTokenData() public view returns (uint256[3] ids, uint256[3] count)",
      "function ownerOfBatch(uint256[] ids) public view returns (address[] owners)",
      "function withdrawFundsReceived() public",
      "function day() public view returns(uint256)",
      "function getClaimedCrew(uint256 plane) public view returns(bool[5] isClaimed)",
      "function create(uint256 _type, uint256 plane, uint256 ci) public payable"
    ],
    address : "0x6D6EF96EFD4E354d63682cBC165f8ddB1cA52dC7",
  },
  CosmicRegistry : {
    abi : [
      "function tokenId(uint256) public view returns(uint256)",
      "function getCPX(address account) public view returns(uint256[7] cpx)",
      "function getBatchCPX(address[] account) public view returns(uint256[7][] cpx) ",
      "function mint(uint256 _i, address[] _who, uint256[] _amt) public",
      "function burn(address _from, uint256[] _ids, uint256[] _values) public",
      "function makeDiamond(uint256 _amt) public",
    ],
    //Kovan 
    address : "0x1083F9E5Df0Debdf7Ec0a52580ad612F41465A04",
  },
  OutlandsUnitStatus : {
    abi : [
      "function getXP(uint256[] ids) public view returns(uint256[] total, uint256[] available)",
      "function getAvailableXP(uint256[] ids) public view returns(uint256[] xp)",
      "function giveXP(uint256[] ids, uint256[] xp) public",
      "function useXP(uint256[] ids, uint256[] xp) public",
      "function getCool(uint256[] ids) public view returns(uint256[] cCool)",
      "function setCool(uint256[] ids, uint256[] _cool) public",
      "function getStatus(uint256[] ids) public view returns(uint16[12][] cStatus)",
      "function setStatus(uint256[] ids, uint8[] i, uint16[] _status) public",
      "function getUnitData(uint256[] ids) public view returns(uint256[] xp, uint256[] cCool, uint16[12][] cStatus)"
    ],
    //Kovan 
    address : "0x246e9084e0a8572FDAc05d2029CDe383c54A830c",
  },
  OutlandsTrouble: {
    abi : [
      "event ChallengeRecord (uint256 indexed period, address indexed player, uint256 planeId, uint256 points, bytes res)",
      "function currentPeriod() public view returns(uint256)",
      "function coolPerStress() public view returns(uint256)",
      "function mayCompleteCheck(uint256 planeId, address player) public view returns (bool mayComplete, uint256 period, uint256 cool)",
      "function complete(address player, uint256 period, uint256 planeId, uint256 points, uint256[] ids, uint256[] xp, uint256[] cool, bytes res) public"
    ],
    //Kovan
    address : "0x402980511D1e0BAc23810B1c1B5ce99e56d867aA",
  },
}

/* Ethers Provider
*/
let block = null, lastPoll = 0, network = null;
let provider = null, signer = null, wallet = null;
if (typeof web3 !== 'undefined') {
    provider = new ethers.providers.Web3Provider(web3.currentProvider)
    signer = provider.getSigner()
} else {    
  provider = ethers.getDefaultProvider('ropsten')
  /*
  //find a signer if stored 
  let lastSigner = localStorage.getItem("lastSigner")
  //if nothing is stored - create wallet and save 
  if(!lastSigner) {
    wallet = ethers.Wallet.createRandom()
    localStorage.setItem(wallet.address, wallet.mnemonic)  
    localStorage.setItem("lastSigner",wallet.address)
  }
  else {
    //pull wallet from mnemonic
    let mnemonic = localStorage.getItem(lastSigner)  
    wallet = ethers.Wallet.fromMnemonic(mnemonic)
    signer = wallet.connect(provider)
  }
  */
}
provider.getNetwork().then(n=> { network = n})
provider.getBlock ( "latest" ).then(b => { block = b })
//always set up basic Ropsten and Kovan provider 
const rProvider = ethers.getDefaultProvider('ropsten')
const kProvider = ethers.getDefaultProvider('kovan') 
//set ropsten contacts for view only 
const viewOutlandsRegistry = new ethers.Contract(CPXContracts.OutlandsRegistry.address,CPXContracts.OutlandsRegistry.abi,rProvider)
//always set kovan contracts
const OutlandsUnitStatus = new ethers.Contract(CPXContracts.OutlandsUnitStatus.address,CPXContracts.OutlandsUnitStatus.abi,kProvider)
const CosmicRegistry = new ethers.Contract(CPXContracts.CosmicRegistry.address,CPXContracts.CosmicRegistry.abi,kProvider)
const OutlandsTrouble = new ethers.Contract(CPXContracts.OutlandsTrouble.address,CPXContracts.OutlandsTrouble.abi,kProvider)

//handle the contracts - connect with the signer / provider 
let OutlandsToken, OutlandsRegistry, outlandsTrouble;
const setContracts = (whoSends) => {
    OutlandsToken = new ethers.Contract(CPXContracts.OutlandsToken.address,CPXContracts.OutlandsToken.abi,whoSends)
    OutlandsRegistry = new ethers.Contract(CPXContracts.OutlandsRegistry.address,CPXContracts.OutlandsRegistry.abi,whoSends)
}
setContracts(signer ? signer : provider)

/*Server 
*/ 
const server = {
    url : "https://outlandsplanes.appspot.com/",
    challengeResolve (id, block) {
        let url = this.url + "trouble/resolve/"+id+"."+block

        return new Promise((resolve,reject)=> {
            $.get(url, (data, status) => resolve(data))  
        })
    },
    testChallengeResolve (id, block) {
        let url = "http://localhost:8080/trouble/resolve/"+id+"."+block

        return new Promise((resolve,reject)=> {
            $.get(url, (data, status) => resolve(data))  
        })
    },
    testResolve (payload) {
      let url = "http://localhost:8080/trouble/testResolve/"+payload
        return new Promise((resolve,reject)=> {
            //call
            $.get(url, (data, status) => resolve(data))  
        })
    }
}

//log check function - searches log back 256 block for a topic releveant to an address
const logCheck = (cAddress, topic, bStart, bStop) => {
    return new Promise((resolve, reject) => {
        let filter = {
            address: cAddress,
            fromBlock: bStart || 0,
            toBlock: bStop || "latest",
            topics: [ topic ]
        }
        provider.getLogs(filter).then(resolve)  
    })
}

//Sign data and then send the sig - hash will be re-created in Solidity for security
const signData = (types,data) => {
    return new Promise((res,reject) => {
        let msgHash = ethers.utils.solidityKeccak256(types, data)
        //add Reqd ethereum signing stamp - mod msg to get correct hash 
        let ethHash = ethers.utils.solidityKeccak256(['string','bytes32'],["\x19Ethereum Signed Message:\n32",msgHash])
        //But sign the original msg - The 66 character hex string MUST be converted to a 32-byte array first!
        let binaryData = ethers.utils.arrayify(msgHash);    
        //sign 
        signer.getAddress().then(address => {
            signer.signMessage(binaryData).then(sig => res({address,msgHash,ethHash,sig}))  
        })
    }) 
}

//Function to check if challenges have been submitted 
const submitChallenge = (app, planeId, heroIds, crewIds) => {
  let {tokens, UIMain} = app 
  //ensure ownership
  let mayContinue = heroIds.concat(crewIds).reduce((mayC,id) => mayC && tokens.has(id),true)
  if(!mayContinue) return 
  //submit to server 
  let data = {planeId, heroIds, crewIds}
  signer.signMessage(JSON.stringify(data)).then(sig => {
    //turn it into hex 
    let payload = {
      address : UIMain.address,
      data,
      sig 
    }
    let hex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(payload)))
    //submit to server 
    server.testResolve(hex).then(res => {
      console.log(res)
    })
  })
}

/*
  Token Functions 
*/

//Function to pull and update Token Data 
const getTokensOfAddress = (app, address) => {
    let cBlock = block.number
    //check if poll is needed 
    if(lastPoll == cBlock || network.name != "ropsten") return 
        
    let {utils,heroCooldown,heroXP,tokensHeroes,UIMain,tokens} = app
    let {tokenTypeIds} = CPXContracts.OutlandsToken
    let topic = OutlandsToken.interface.events.TransferSingle.topic
    
    logCheck(OutlandsToken.address,topic,lastPoll).then(res => {
      //roll through each 
        res.forEach(log => {
            //now pull data fron log 
            let data = OutlandsToken.interface.parseLog(log)
            //go to next if not the current address / has id loaded 
            let {_from, _to, _id} = data.values
            if(address != _to && address != _from) return;
            //check for nft 
            let _hex = _id.toHexString()
            let tData = {block:log.blockNumber}
            //it is nft 
            if(_hex.charAt(2) == 8) {
              let nftType = _hex.slice(0,35).padEnd(66,"0")
              let _typeId = ethers.utils.bigNumberify(nftType).toString()
              //set data 
              tData.nft = true 
              tData._typeId = _typeId
              //check id 
              let typeName = tokenTypeIds[_typeId]
              tData.typeName = typeName
              tData.i = parseInt(_hex.slice(34), 16)
              tData._hex = _hex
              //check if it exists 
              if(!tokens.has(typeName)) {
                tokens.set(typeName,new Set())
              }
            }
            else {
            }
            //now review 
            if(address == _to) {
              tokens.set(_id.toString(),tData)
              //add new nft to set 
              if(tData.nft) {
                let nft = tokens.get(tData.typeName)
                nft.add(_id.toString())
              }
            }
            else {
              tokens.delete(_id.toString())
              //add new nft to set 
              if(tData.nft) {
                let nft = tokens.get(tData.typeName)
                nft.delete(_id.toString())
              }
            }
        })
        //now push updates 
        UIMain.planes = [...tokens.get("plane").values()]
        //now pull new hero data
        getHeroData([...tokens.get("hero").values()],app,lastPoll)
        //pull crew data  
        getCrewData([...tokens.get("crew").values()],app,lastPoll)
        //add local data 
        app.setLocalData() 
        //now set new last poll 
        lastPoll = cBlock
    })
}

/*
  Hero Functions 
*/

//initial pull of hero data 
const getHeroData = (ids,app,start) => {
  if(ids.length == 0) return 
  let {UIMain,tokens,utils,heroes} = app
  let topic = OutlandsRegistry.interface.events.NewHero.topic

  logCheck(OutlandsRegistry.address,topic,start).then(res => {
    //roll through each 
        res.forEach(log => {
            //now pull data fron log 
            let data = OutlandsRegistry.interface.parseLog(log)
            //go to next if not loaded
            let {player, i, plane} = data.values
            //get the long eth token id 
            let hex =  "0x80000000000000000000000000000002" + i.toNumber().toString(16).padStart(32,"0")
            let _id = ethers.utils.bigNumberify(hex).toString()
            if(!ids.includes(_id)) return 
            //get hero data 
            let hero = utils.heroData(_id, plane.toString(), log.blockNumber, 0, network.chainId)
            heroes.set(hero.id,hero)
        })
  })
}
//polls looking for updates 
const pollHeroes = (app) => {
  //get array of ids 
  let ids = app.UIMain.heroIds
  //pull unit data 
  OutlandsUnitStatus.getUnitData(ids).then(res => {
    app.heroes.forEach((h,id) => {
      let i = ids.indexOf(id)
      h._xp = res.xp[i].toNumber()
      h.cool = res.cCool[i].toNumber()
      h.status = res.cStatus[i]
    })
  })
}

/*
  Crew Functions 
*/

//Function to pull and update crew data
const getPlaneCrewData = (app, plane) => {
  let {day, mayClaim} = app 
  let {planeCrew} = app.UIMain
  //first pull plaine crew index 
  OutlandsRegistry.getClaimedCrew(plane._id).then(isClaimed => {
    planeCrew.crew = isClaimed.map((av,i) => {
      let C = app.utils.crewDataFromDay(day,plane,i)
      C.available = app.mayClaim("crew",plane.i,i) && !av 
      return C 
    })
  })
}

//initial pull of crew data 
const getCrewData = (ids,app,start) => {
  if(ids.length == 0) return 
  let {UIMain,tokens,utils,planes,crew} = app
  let topic = OutlandsRegistry.interface.events.NewUnit.topic

  logCheck(OutlandsRegistry.address,topic,start).then(res => {
    //roll through each 
        res.forEach(log => {
            //now pull data fron log 
            let data = OutlandsRegistry.interface.parseLog(log)
            //go to next if not loaded
            let {player, i, plane, hash} = data.values
            //get the long eth token id 
            let hex =  "0x80000000000000000000000000000003" + i.toNumber().toString(16).padStart(32,"0")
            let _id = ethers.utils.bigNumberify(hex).toString()
            if(!ids.includes(_id)) return 
            //get plane 
            plane = planes.get(plane.toString())
            //get hero data 
            let cD = utils.crewData(_id,plane,hash)
            //update 
            crew.set(_id,cD)
        })
  })
}

const check = (app) => {
  let {UIMain,utils,planes,planets,tokens,cooldown} = app
  //save state 
  app.save()

  if(network && block) {
    provider.getNetwork().then(n=> { network = n})
    //set data for later
    provider.getBlock ( "latest" ).then(b => { block = b })

    if (typeof web3 !== 'undefined') {
      signer = provider.getSigner()
    }

    //trouble period
    OutlandsTrouble.currentPeriod().then(d => UIMain.currentPeriod = d.toNumber())
    //get day 
    viewOutlandsRegistry.day().then(d => UIMain.day = d.toNumber())
    //get range of tokens 
    viewOutlandsRegistry.getTokenData().then(data => {
      let {count} = data 
      count = count.map(c => c.toNumber())
      //set storage 
      localStorage.setItem("nPlanes", count[0])
      //find new planes 
      let pids = d3.range(count[0]).map(i => i).filter(i => !planes.has(i))
      //now pull data 
      pids.forEach(i => utils.addPlaneData(i, app))
    })
    //cost 
    viewOutlandsRegistry.cost(0).then(c => UIMain.searchCost = ethers.utils.formatEther(c))
    viewOutlandsRegistry.cost(1).then(c => UIMain.recruitCost = ethers.utils.formatEther(c))
    viewOutlandsRegistry.cost(2).then(c => UIMain.recruitCrewCost = ethers.utils.formatEther(c))
    //check if plane selected
    if(UIMain.tid>-1) {
      //get available crew 
      getPlaneCrewData(app, UIMain.planeData)
      //check for time 
      OutlandsRegistry.nextTimePlane(UIMain.planeData._id).then(t => {
        t = t.toNumber() 
        let _cool = cooldown[UIMain.planeData._id] || 0
        //set cool for plane 
        if(t > _cool) cooldown[UIMain.planeData._id] = t
      })
    }
  }

  //scan for CPX
  if(UIMain && signer) {
    //get address 
    let address = UIMain.address

    signer.getAddress().then(a => {
        if(a != UIMain.address) {
          //set last address 
          localStorage.setItem("lastAddress",a)
          UIMain.address = a  
          //redo contracts 
          setContracts(signer)
          //load data from db
          app.load()
          //reset poll 
          tokens = new Map()
          lastPoll = 0 
        }
      })
      //get the eth balance  
      signer.getBalance().then(b => {
        UIMain.balance = ethers.utils.formatEther(b).slice(0,5)
      }) 

    if(address == "local" || address == "" || network.name != "ropsten") return 
    //get tokens 
    getTokensOfAddress(app,address)
    //get cpx 
    CosmicRegistry.getCPX(address).then(res => UIMain.CPX = res.map(c => ethers.utils.formatEther(c)))
    //poll hero data 
    pollHeroes(app,address)

    //look if there is shares to claim 
    OutlandsRegistry.fundsReceived(address).then(s => UIMain.shareToClaim = ethers.utils.formatEther(s))
    //time 
    OutlandsRegistry.nextTimePlayer(address).then(t => UIMain.nextSearch = t.toNumber())
    if(UIMain.tid>-1) {
      OutlandsTrouble.mayCompleteCheck(UIMain.planeData._id, address).then(res =>{
        //claim it if it is done 
        if(!res.mayComplete) {
          app.makeClaim("trouble",UIMain.planeData.i,0)
        }
      })
    }
  }  
}

const getContracts = () => {
    return {OutlandsToken,OutlandsRegistry,outlandsTrouble}
}

export {
    provider,
    check,
    getContracts,
    signData,
    submitChallenge
}