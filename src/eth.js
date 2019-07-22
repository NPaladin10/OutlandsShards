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
  OutlandsXP : {
    abi : [
      "function activeXP(uint256) public view returns(uint256, uint256)"
    ],
    address : "0x58E2671A70F57C1A76362c5269E3b1fD426f43a9"
  },
  OutlandsHeroCooldown : {
    abi : [
      "function cooldown(uint256) public view returns(uint256)"
    ],
    address : "0x0152Cf49360eed5B35c170081Ee8aC0e5c1e2e7C"
  },
}

/* Ethers Provider
*/
let block = null, network = null;
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

//handle the contracts - connect with the signer / provider 
let OutlandsToken, OutlandsRegistry, outlandsTrouble, outlandsXP, outlandsCool;
const setContracts = (whoSends) => {
    OutlandsToken = new ethers.Contract(CPXContracts.OutlandsToken.address,CPXContracts.OutlandsToken.abi,whoSends)
    OutlandsRegistry = new ethers.Contract(CPXContracts.OutlandsRegistry.address,CPXContracts.OutlandsRegistry.abi,whoSends)
    outlandsTrouble = new ethers.Contract(CPXContracts.OutlandsTrouble.address,CPXContracts.OutlandsTrouble.abi,whoSends)
    outlandsXP = new ethers.Contract(CPXContracts.OutlandsXP.address,CPXContracts.OutlandsXP.abi,whoSends)    
    outlandsCool = new ethers.Contract(CPXContracts.OutlandsHeroCooldown.address,CPXContracts.OutlandsHeroCooldown.abi,whoSends)    
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
    testResolve (text) {
        return new Promise((resolve,reject)=> {
            //sign the data 
            signData(["string"],[text]).then((sigData) => {
                let {address,msgHash,ethHash,sig} = sigData
                //convert the whole mesage to hex 
                let pkg = {
                    txt : text,
                    address,msgHash,ethHash,sig
                }
                //ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(data)))
                let hexString = toHexString(pkg)
                let url = "http://localhost:8080/" + "trouble/testResolve/"+hexString
                //call
                $.get(url, (data, status) => resolve(data))  
            })  
        })
    }
}
const challengeResolve = server.testChallengeResolve 

//log check function - searches log back 256 block for a topic releveant to an address
const logCheck = (cAddress, topic, bn) => {
    return new Promise((resolve, reject) => {
        let filter = {
            address: cAddress,
            fromBlock: bn || 0,
            toBlock: bn || "latest",
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
const submittedChallengeCheck = (app, address) => {
    logCheck(outlandsTrouble.address,outlandsTrouble.interface.events.NewChallenge.topic).then(res => {
        return
        //roll through each 
        res.forEach(log => {
            //now pull data fron log 
            let data = outlandsTrouble.interface.parseLog(log)
            //go to next if not the current address / has id loaded 
            let {player, id} = data.values
            if(player != address) return;
            if(app.challenges.has(id)) return;
            //otherwise pull challenge 
            let {heroes,plane,period} = data.values
            let hids = heroes.map(hid => hid.toNumber())
            //set challenge data
            let C = {
                block : log.blockNumber,
                heroes : hids,
                _xp : hids.map(hi => app.heroXP.get(hi)[1]),
                plane : plane.toNumber(),
                period : period.toNumber()
            }
            //submit to server 
            server.challengeResolve(id,C.block).then(cData => {
                //set hash
                C.hash = cData.hash
                C.reward = cData.reward
                //set in challenges
                app.challenges.set(id,C) 
                //notify
                if(C.reward[1] != "0") {
                    let cpx = " You got "+ethers.utils.formatEther(C.reward[1])+" "+ app.UIMain.cpxNames[C.reward[0]]+"!" 
                    app.simpleNotify("You completed the challenge!"+cpx,"success")
                }
                else {
                    app.simpleNotify("You failed the challenge.","error")
                    //notify of hero xp 
                    cData.xp.forEach(val => {
                        app.simpleNotify("Hero #"+val[0]+" earned "+val[1]+" XP.","success")
                    })
                }
            })
        })
    })
}

//Function to pull and update crew data
const getPlaneCrewData = (app, plane) => {
  let {planeCrew, day} = app.UIMain 
  //first pull plaine crew index 
  OutlandsRegistry.getClaimedCrew(plane._id).then(isClaimed => {
    planeCrew.crew = isClaimed.map((av,i) => {
      let C = app.utils.crewData(day,plane,i)
      C.available = !av 
      return C 
    })
  })
} 

//Function to pull and update Token Data 
const getTokensOfAddress = (app, address) => {
    let {utils,heroCooldown,heroXP,tokensHeroes,UIMain,tokens} = app
    let {tokenTypeIds} = CPXContracts.OutlandsToken
    
    logCheck(OutlandsToken.address,OutlandsToken.interface.events.TransferSingle.topic).then(res => {
      //roll through each 
        res.forEach(log => {
            //now pull data fron log 
            let data = OutlandsToken.interface.parseLog(log)
            //go to next if not the current address / has id loaded 
            let {_from, _to, _id} = data.values
            if(address != _to && address != _from) return;
            //check for nft 
            let _hex = _id.toHexString()
            let tData = {}
            //it is nft 
            if(_hex.charAt(2) == 8) {
              let nftType = ethers.utils.hexDataSlice(_hex,0,16)
              let _typeId = ethers.utils.bigNumberify(nftType+"00000000000000000000000000000000").toString()
              //set data 
              tData.nft = true 
              tData._typeId = _typeId
              //check id 
              tData.typeName = tokenTypeIds[_typeId]
              tData.type = "0x0" + nftType.slice(3)
              tData.id = ethers.utils.hexDataSlice(_hex,16) 
              tData._hex = _hex
              //check if it exists 
              if(!tokens.has(_typeId)) {
                tokens.set(_typeId,new Set())
              }
            }
            else {
            }
            //now review 
            if(address == _to) {
              tokens.set(_id.toString(),tData)
              //add new nft to set 
              if(tData.nft) {
                let nft = tokens.get(tData._typeId)
                nft.add(_id.toString())
              }
            }
            else {
              tokens.delete(_id.toString())
              //add new nft to set 
              if(tData.nft) {
                let nft = tokens.get(tData._typeId)
                nft.delete(_id.toString())
              }
            }
        })
        //now push updates 
        UIMain.planes = [...tokens.get(tokenTypeIds.plane).values()]
        //heroes
        let hids = [...tokens.get(tokenTypeIds.hero).values()]
        //crew 
        //UIMain.planes = [...tokens.get(tokenTypeIds.plane).values()]
    })
}

const rawHeroData = (app) => {
  let {UIMain,tokens} = app
  let {tokenTypeIds} = CPXContracts.OutlandsToken

  logCheck(OutlandsRegistry.address,OutlandsRegistry.interface.events.NewHero.topic).then(res => {
    //roll through each 
        res.forEach(log => {
            //now pull data fron log 
            let data = OutlandsRegistry.interface.parseLog(log)
            //go to next if not loaded
            let {player, i, plane} = data.values
            //get the long eth token id 
            let hex = "0x80000000000000000000000000000002" + ethers.utils.hexZeroPad(i.toHexString(),16).slice(2)
            let _id = ethers.utils.bigNumberify(hex).toString()
            let tData = tokens.get(_id)
            if(tData) {
              tData.block = log.blockNumber
              tData.plane = plane.toString()
              //update 
              tokens.set(_id,tData)
            }
        })
  })
}

const check = (app) => {
  let {UIMain,utils,tokensPlanes,tokensHeroes,planets,tokens} = app

  if(network && block) {
    provider.getNetwork().then(n=> { network = n})
    //set data for later
    provider.getBlock ( "latest" ).then(b => { block = b })

    if (typeof web3 !== 'undefined') {
      signer = provider.getSigner()
    }

    //start polling 
    rawHeroData(app)

    //get range of tokens 
    OutlandsRegistry.getTokenData().then(data => {
      let {count} = data 
      count = count.map(c => c.toNumber())
      //set storage 
      localStorage.setItem("nPlanes", count[0])
      //find new planes 
      let pids = d3.range(count[0]).map(i => i).filter(i => !tokensPlanes.has(i))
      //now pull data 
      pids.forEach(i => utils.addPlaneData(i, planets, tokensPlanes))
    })

    //get challenge period 
    outlandsTrouble.currentPeriod().then(p => UIMain.currentPeriod = p.toNumber()) 
    //get day 
    OutlandsRegistry.day().then(d => UIMain.day = d.toNumber())
    //check for toruble 
    if(UIMain.tid != -1) {
      let T = UIMain.trouble
    }
  }

  //scan for CPX
  if(UIMain && signer) {
    let address = UIMain.address

    //cost 
    OutlandsRegistry.cost(0).then(c => UIMain.searchCost = ethers.utils.formatEther(c))
    OutlandsRegistry.cost(1).then(c => UIMain.recruitCost = ethers.utils.formatEther(c))
    OutlandsRegistry.cost(2).then(c => UIMain.recruitCrewCost = ethers.utils.formatEther(c))
    outlandsTrouble.costToChallenge().then(c => UIMain.challengeCost = ethers.utils.formatEther(c))

    signer.getAddress().then(a => {
        if(a != UIMain.address) {
          UIMain.address = a  
          //redo contracts 
          setContracts(signer)
          //load data from db
          app.load()
          //
          tokens = new Map()
        }
      })
      //get the eth balance  
      signer.getBalance().then(b => {
        UIMain.balance = ethers.utils.formatEther(b).slice(0,5)
      }) 

    if(address !="") {
      //save state 
      app.save()
      //push challenges 
      UIMain.completedChallenges = [...app.challenges.entries()] 
      //check for submitted challenges
      submittedChallengeCheck(app, address) 
      //get tokens 
      getTokensOfAddress(app,address)

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
}

const getContracts = () => {
    return {OutlandsToken,OutlandsRegistry,outlandsTrouble}
}

export {
    provider,
    check,
    getContracts,
    signData,
    challengeResolve
}