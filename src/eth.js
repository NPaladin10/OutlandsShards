const addressFromTopic = (id, topic) => {
    return ethers.utils.getAddress(ethers.utils.hexStripZeros(topic[id])) 
}

const toHexString = (obj) => {
    return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(obj)))
}

/* Contract Data 
*/

let CPXContracts = {
  OutlandsPlanes : {
    abi : [
      "event NewPlane (address indexed finder, uint256 i)",
      "function costToSearch() public view returns(uint256)",
      "function timeBetweenSearches() public view returns(uint256)",
      "function nextSearchTime(address) public view returns(uint256)",
      "function totalSupply() public view returns(uint256)",
      "function tokensOfOwner(address owner) external view returns (uint256[])",
      "function Search() public payable", 
    ],
    address : "0xa8Af2e26488a02A4653687f71EFA212a2001e7a2"
  },
  OutlandsHeroes : {
    abi : [
      "event NewHero (address indexed finder, uint256 indexed plane, uint256 i)",
      "function costToRecruit() public view returns(uint256)",
      "function timeBetweenRecruit() public view returns(uint256)",
      "function nextRecruitTime(uint256) public view returns(uint256)",
      "function fundsReceived(address) public view returns(uint256)",
      "function Heroes(uint256) public view returns(uint256,bytes32)",
      "function totalSupply() public view returns(uint256)",
      "function tokensOfOwner(address owner) external view returns (uint256[])",
      "function Recruit(uint256 pi) public payable",
      "function withdrawFundsReceived() public",
      "function withdrawToBank() public"
    ],
    address : "0xeBEF6F1ffc0c97a83FB136F9D45f81a6E471B4B8"
  },
  OutlandsCrew : {
    abi : [
      "event NewCrew (address indexed finder, uint256 id, uint256 indexed plane, uint256 i)",
      "function costToRecruit() public view returns(uint256)",
      "function timeBetweenRecruit() public view returns(uint256)",
      "function nextRecruitTime(uint256) public view returns(uint256)",
      "function fundsReceived(address) public view returns(uint256)",
      "function totalSupply() public view returns(uint256)",
      "function tokensOfOwner(address owner) external view returns (uint256[])",
      "function withdrawFundsReceived() public",
      "function withdrawToBank() public",
      "function getCrewClaimed(uint256 plane) public view returns(bool[7] isClaimed)",
      "function getCrewData(uint256 id) public view returns(address, uint256[2])",
      "function Recruit(uint256 plane, uint256 i) public payable",
      "function increaseIndex(uint256 plane) public payable",
      "function planeCrewIndex(uint256) public view returns(uint256)"
    ],
    address : "0x124100394DA21da560722F9E9E895a2E72bfB170"
  },
  OutlandsTrouble: {
    abi : [
      "event NewChallenge (bytes32 id, uint256 period, address indexed player, uint256 indexed plane, uint256[] heroes)",
      "event CompleteChallenge (bytes32 id, bytes32 hash, uint256[] pxp)",
      "function cooldown(uint256 ti) public view returns(uint256)",
      "function currentPeriod() public view returns(uint256)",
      "function timeBetweenPeriods() public view returns(uint256)",
      "function costToChallenge() public view returns(uint256)",
      "function completedChallenges(bytes32) public view returns (bool)",
      "function completedTrouble(bytes32) public view returns (bool)",
      "function complete(bytes32 id, bytes32 hash, address player, uint256[2] cpx, uint256[] heroes, uint256[] xp, uint256[] pxp, uint256[] cool)",
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
  CPX : {
    abi : [
      "function balanceOf(address account) external view returns (uint256)",
      "function authorizeOperator(address operator) external",
      "function isOperatorFor(address operator, address tokenHolder) external view returns (bool)",
      "function operatorBurn(address account, uint256 amount,bytes data,bytes operatorData) external"
    ],
    address : [
      "0xc7a70cb917673db93053f08504e0a7ff74cdd387",
      "0x03bcdd8051bd8ac2182892302cf9307d9bf7ad06",
      "0x67b3d1bc921864da467d465de0e5c5ea81a53a56",
      "0x118ccb092c331eac2a18369102db4a58e1f1a0d7",
      "0xf715d24f6924ca326fedfb78e7b4a99d3f7305be",
      "0xc0464049799024f02118d8cdb8cd4b858154707c",
      "0x2ef8b97424b11b9a956d91657604535a29b258e7"
      ]
  }
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
let outlandsPlanes, outlandsHeroes, outlandsCrew, outlandsTrouble, outlandsXP, outlandsCool;
const setContracts = (whoSends) => {
    outlandsPlanes = new ethers.Contract(CPXContracts.OutlandsPlanes.address,CPXContracts.OutlandsPlanes.abi,whoSends)
    outlandsHeroes = new ethers.Contract(CPXContracts.OutlandsHeroes.address,CPXContracts.OutlandsHeroes.abi,whoSends)
    outlandsCrew = new ethers.Contract(CPXContracts.OutlandsCrew.address,CPXContracts.OutlandsCrew.abi,whoSends)
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
const getPlaneCrewData = (app, planeId) => {
  let {planeCrew} = app.UIMain 
  //first pull plaine crew index 
  outlandsCrew.planeCrewIndex(planeId).then(cid => {
    cid = cid.toNumber()
    //get timer 
    outlandsCrew.nextRecruitTime(planeId).then(time => {
      planeCrew.time = time.toNumber()
      //now find out who is available 
      outlandsCrew.getCrewClaimed(planeId).then(isClaimed => {
        planeCrew.crew = isClaimed.map((av,i) => {
          let C = app.utils.crewData(planeId,cid+i)
          C.available = !av 
          return C 
        })
      })
    })
  })
} 

//Function to pull and update hero data 
const getHeroData = (app, address) => {
    let {utils,heroCooldown,heroXP,tokensHeroes,UIMain} = app

    outlandsHeroes.tokensOfOwner(address).then(T => {
        T = T.map(ti => ti.toNumber())
        //check for differences 
        UIMain.heroIds.filter(ti => !T.includes(ti))
            .forEach(ti => {
                //now remove them 
                tokensHeroes.delete(ti)
            })
        //check for new heroes 
        if(T.length > UIMain.heroIds.length){
            let n = T.length - UIMain.heroIds.length
            app.simpleNotify("You now have "+n+" new heroes!","success")
        }

        T.forEach(ti => {
          //check for cooldown
          outlandsCool.cooldown(ti).then(cool => {
              cool = cool.toNumber()
              let _cool = heroCooldown.get(ti) || 0
              let now = Date.now() / 1000
              //seconds to hours 
              let when = (cool - now)/(60*60)  
              //notify
              if(_cool != cool && cool > 0 && when > 0) {
                  app.simpleNotify("Hero #"+ti+" has a cooldown of "+when.toFixed(2)+"hrs","warning")
              }
              heroCooldown.set(ti,cool)
          })
          //check for XP
          outlandsXP.activeXP(ti).then(xp => {
              xp = xp.map(x => x.toNumber())
              let _xp = heroXP.get(ti) || [0,0]
              //difference
              let diff = xp.map((x,xi) => x-_xp[xi])
              //notify
              if(diff[1] > 0) {
                  app.simpleNotify("Hero #"+ti+" now has "+xp[1]+" XP!","success")
              }
              heroXP.set(ti,xp)
          })
          //now get hero hash  
          outlandsHeroes.Heroes(ti).then(res => {
              //res = [pi,hash]
              let hero = utils.heroData(ti,res[0].toNumber(),res[1],heroXP.get(ti))
              hero.cool = heroCooldown.get(ti)
              //don't overwrite name 
              let _h = tokensHeroes.get(ti)
              hero.name = _h.name || ""
              //set 
              tokensHeroes.set(ti,hero)
              //set data for UIMain
              UIMain.heroIds = [...tokensHeroes.keys()]
            })
        })
      })
}

const check = (app) => {
  let {UIMain,utils,tokensPlanes,tokensHeroes,planets} = app

  if(network && block) {
    provider.getNetwork().then(n=> { network = n})
    //set data for later
    provider.getBlock ( "latest" ).then(b => { block = b })

    if (typeof web3 !== 'undefined') {
      signer = provider.getSigner()
    }

    //get range of tokens 
    outlandsPlanes.totalSupply().then(n => {
      n = n.toNumber()
      //set storage 
      localStorage.setItem("nPlanes", n)
      //find new planes 
      let pids = d3.range(n).map(i => i).filter(i => !tokensPlanes.has(i))
      //now pull data 
      pids.forEach(i => utils.addPlaneData(i, planets, tokensPlanes))
    })

    //get challenge period 
    outlandsTrouble.currentPeriod().then(p => UIMain.currentPeriod = p.toNumber()) 
    //check for toruble 
    if(UIMain.tid != -1) {
      let T = UIMain.trouble
      outlandsTrouble.completedTrouble(T.simpleHash).then(isComplete => {
        
      }) 
    }
  }

  //scan for CPX
  if(UIMain && signer) {
    let address = UIMain.address

    //cost 
    outlandsPlanes.costToSearch().then(c => UIMain.searchCost = ethers.utils.formatEther(c))
    outlandsHeroes.costToRecruit().then(c => UIMain.recruitCost = ethers.utils.formatEther(c))
    outlandsCrew.costToRecruit().then(c => UIMain.recruitCrewCost = ethers.utils.formatEther(c))
    outlandsTrouble.costToChallenge().then(c => UIMain.challengeCost = ethers.utils.formatEther(c))

    signer.getAddress().then(a => {
        if(a != UIMain.address) {
          UIMain.address = a  
          //redo contracts 
          setContracts(signer)
          //load data from db
          app.load()
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
      outlandsPlanes.tokensOfOwner(address).then(T => {
          T = T.map(ti => ti.toNumber())
          //check for new planes 
          if(T.length != UIMain.owns.length){
              let n = T.length - UIMain.owns.length
              let dT = T.filter(ti => !UIMain.owns.includes(ti))
              app.simpleNotify("You now have "+n+" new planes!","success")
          }
          //log of Token ids 
          UIMain.owns = T.slice()
      })

      //pull hero data 
      getHeroData(app,address)

      //look if there is shares to claim 
      outlandsHeroes.fundsReceived(address).then(s => UIMain.shareToClaim = ethers.utils.formatEther(s))

      //time 
      outlandsPlanes.nextSearchTime(address).then(t => UIMain.nextSearch = t.toNumber())
      //check if plane selected
      if(UIMain.tid>-1) {
        //get available crew 
        getPlaneCrewData(app, UIMain.tid)
        //check for time 
        outlandsHeroes.nextRecruitTime(UIMain.tid).then(t => UIMain.nextRecruit = t.toNumber())
      }
    }
  }  
}

const getContracts = () => {
    return {outlandsPlanes,outlandsHeroes,outlandsTrouble,outlandsCrew}
}

export {
    provider,
    check,
    getContracts,
    signData,
    challengeResolve
}