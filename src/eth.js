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
      "event NewChallenge (bytes32 id, uint256 period, address indexed player, uint256 indexed plane, uint256[] heroes)",
      "event CompleteChallenge (bytes32 id, bytes32 hash, uint256[] pxp)",
      "function currentPeriod() public view returns(uint256)",
      "function coolPerStress() public view returns(uint256)",
      "function timeBetweenPeriods() public view returns(uint256)",
      "function costToChallenge() public view returns(uint256)",
      "function completedChallenges(bytes32) public view returns (bool)",
      "function complete(uint256 plane, bytes32 id, bytes32 hash, address player, uint256[2] cpx, uint256[] heroes, uint256[] xp, uint256[] pxp, uint256[] cool)",
      "function submitChallenge(uint256 plane, uint256[] heroes) public payable"
    ],
    address : "0x78a4f476a44aa74829a967a80a1c9443a8dffa2e",
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

//handle the contracts - connect with the signer / provider 
let OutlandsToken, OutlandsRegistry, outlandsTrouble;
const setContracts = (whoSends) => {
    OutlandsToken = new ethers.Contract(CPXContracts.OutlandsToken.address,CPXContracts.OutlandsToken.abi,whoSends)
    OutlandsRegistry = new ethers.Contract(CPXContracts.OutlandsRegistry.address,CPXContracts.OutlandsRegistry.abi,whoSends)
    outlandsTrouble = new ethers.Contract(CPXContracts.OutlandsTrouble.address,CPXContracts.OutlandsTrouble.abi,whoSends)
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
        UIMain.heroIds = [...tokens.get("hero").values()]
        UIMain.crewIds = [...tokens.get("crew").values()]
        //now pull new hero data
        getHeroData(UIMain.heroIds,app,lastPoll)
        //pull crew data  
        getCrewData(UIMain.crewIds,app,lastPoll)
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
            let hero = utils.heroData(_id, plane.toString(), log.blockNumber)
            heroes.set(_id,hero)
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
  let {planeCrew, day} = app.UIMain 
  //first pull plaine crew index 
  OutlandsRegistry.getClaimedCrew(plane._id).then(isClaimed => {
    planeCrew.crew = isClaimed.map((av,i) => {
      let C = app.utils.crewDataFromDay(day,plane,i)
      C.available = !av 
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
  let {UIMain,utils,planes,planets,tokens} = app

  if(network && block) {
    provider.getNetwork().then(n=> { network = n})
    //set data for later
    provider.getBlock ( "latest" ).then(b => { block = b })

    if (typeof web3 !== 'undefined') {
      signer = provider.getSigner()
    }

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
    //outlandsTrouble.costToChallenge().then(c => UIMain.challengeCost = ethers.utils.formatEther(c))
  }

  //scan for CPX
  if(UIMain && signer) {
    let address = UIMain.address

    signer.getAddress().then(a => {
        if(a != UIMain.address) {
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

    if(address == "" || network.name != "ropsten") return 
    //save state 
    app.save()
    //get tokens 
    getTokensOfAddress(app,address)
    //poll hero data 
    pollHeroes(app,address)

    //look if there is shares to claim 
    OutlandsRegistry.fundsReceived(address).then(s => UIMain.shareToClaim = ethers.utils.formatEther(s))

    //time 
    OutlandsRegistry.nextTimePlayer(address).then(t => UIMain.nextSearch = t.toNumber())
    //check if plane selected
    if(UIMain.tid>-1) {
      //get available crew 
      getPlaneCrewData(app, UIMain.planeData)
      //check for time 
      OutlandsRegistry.nextTimePlane(UIMain.planeData._id).then(t => UIMain.nextRecruit = t.toNumber())
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