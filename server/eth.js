const keys = require('./keys');
const ethers = require('ethers');
const {planeTrouble, heroData} = require('./utilities');

//Load ethereum
const provider = ethers.getDefaultProvider('ropsten')
const kProvider = ethers.getDefaultProvider('kovan')
const wallet = new ethers.Wallet(keys.ropsten,provider)
const kWallet = new ethers.Wallet(keys.ropsten,kProvider)
console.log("Linked to address: " + wallet.address)
wallet.getBalance().then(b=>{
    console.log("Balance: " + ethers.utils.formatEther(b))
}
)
kWallet.getBalance().then(b=>{
    console.log("kBalance: " + ethers.utils.formatEther(b))
}
)

/* Contract Data 
*/

const CPXContracts = {
    OutlandsToken: {
        abi: ["event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)", "event URI(string _value, uint256 indexed _id)", "function ownerOf(uint256 _id) public view returns (address)", "function balanceOf(address _owner, uint256 _id) external view returns (uint256)", "function isApprovedForAll(address _owner, address _operator) external view returns (bool)", "function getNonFungibleIndex(uint256 _id) public pure returns(uint256)", "function getNonFungibleBaseType(uint256 _id) public pure returns(uint256)"],
        address: "0x20a2F9E30bdecAFfdc7B9571FF7CAC585D054014",
        tokenTypeIds: {
            "57896044618658097711785492504343953926975274699741220483192166611388333031424": "plane",
            "plane": "57896044618658097711785492504343953926975274699741220483192166611388333031424",
            "hero": "57896044618658097711785492504343953927315557066662158946655541218820101242880",
            "57896044618658097711785492504343953927315557066662158946655541218820101242880": "hero",
            "crew": "57896044618658097711785492504343953927655839433583097410118915826251869454336",
            "57896044618658097711785492504343953927655839433583097410118915826251869454336": "crew"
        }
    },
    OutlandsRegistry: {
        abi: ["event NewPlane (address indexed player, uint256 i)", "event NewHero (address indexed player, uint256 i, uint256 plane)", "event NewUnit (address indexed player, uint256 i, uint256 plane, bytes32 hash)", "event FundsWithdrawn (address indexed who, uint256 amt)", "function cost(uint256) public view returns(uint256)", "function shareToOwner(uint256) public view returns(uint256)", "function timeBetween(uint256) public view returns(uint256)", "function nextTimePlayer(address) public view returns(uint256)", "function nextTimePlane(uint256) public view returns(uint256)", "function fundsReceived(address) public view returns(uint256)", "function getTokenData() public view returns (uint256[3] ids, uint256[3] count)", "function ownerOfBatch(uint256[] ids) public view returns (address[] owners)", "function withdrawFundsReceived() public", "function day() public view returns(uint256)", "function getClaimedCrew(uint256 plane) public view returns(bool[5] isClaimed)", "function create(uint256 _type, uint256 plane, uint256 ci) public payable"],
        address: "0x6D6EF96EFD4E354d63682cBC165f8ddB1cA52dC7",
    },
    OutlandsUnitStatus: {
        abi: ["function getXP(uint256[] ids) public view returns(uint256[] total, uint256[] available)", "function getAvailableXP(uint256[] ids) public view returns(uint256[] xp)", "function giveXP(uint256[] ids, uint256[] xp) public", "function useXP(uint256[] ids, uint256[] xp) public", "function getCool(uint256[] ids) public view returns(uint256[] cCool)", "function setCool(uint256[] ids, uint256[] _cool) public", "function getStatus(uint256[] ids) public view returns(uint16[12][] cStatus)", "function setStatus(uint256[] ids, uint8[] i, uint16[] _status) public", "function getUnitData(uint256[] ids) public view returns(uint256[] xp, uint256[] cCool, uint16[12][] cStatus)"],
        //Kovan 
        address: "0x246e9084e0a8572FDAc05d2029CDe383c54A830c",
    },
}

const OutlandsToken = new ethers.Contract(CPXContracts.OutlandsToken.address,CPXContracts.OutlandsToken.abi,wallet)
const OutlandsRegistry = new ethers.Contract(CPXContracts.OutlandsRegistry.address,CPXContracts.OutlandsRegistry.abi,wallet)
const outlandsTrouble = null
const OutlandsUnitStatus = new ethers.Contract(CPXContracts.OutlandsUnitStatus.address,CPXContracts.OutlandsUnitStatus.abi,kWallet)

//log check function - searches log back 256 block for a topic releveant to an address
const logCheck = (source,cAddress,topic,bStart,bStop)=>{
    return new Promise((resolve,reject)=>{
        let filter = {
            address: cAddress,
            fromBlock: bStart || 0,
            toBlock: bStop || "latest",
            topics: [topic]
        }
        source.getLogs(filter).then(resolve)
    }
    )
}

//Sign data and then send the sig - hash will be re-created in Solidity for security
const signData = (types,data)=>{
    return new Promise((res,reject)=>{
        let msgHash = ethers.utils.solidityKeccak256(types, data)
        //add Reqd ethereum signing stamp - mod msg to get correct hash 
        let ethHash = ethers.utils.solidityKeccak256(['string', 'bytes32'], ["\x19Ethereum Signed Message:\n32", msgHash])
        //But sign the original msg - The 66 character hex string MUST be converted to a 32-byte array first!
        let binaryData = ethers.utils.arrayify(msgHash);
        //sign 
        signer.getAddress().then(address=>{
            signer.signMessage(binaryData).then(sig=>res({
                address,
                msgHash,
                ethHash,
                sig
            }))
        }
        )
    }
    )
}

//validate a message
const validateMessage = (hash,sig)=>{
    //correct representation of hash 
    //The 66 character hex string MUST be converted to a 32-byte array first!
    let binaryData = ethers.utils.arrayify(hash)
    return ethers.utils.verifyMessage(binaryData, sig)
}

//initial pull of hero data 
const getHeroData = async(ids)=>{
    if (ids.length == 0)
        return []

    //first status 
    let allStatus = await OutlandsUnitStatus.getUnitData(ids)
    //setup data return 
    let data = {
        xp: allStatus[0].map(xp=>xp.toNumber()),
        cool: allStatus[1].map(cool=>cool.toNumber()),
        status: allStatus[2],
        planes: [],
        blocks: []
    }

    //now pull logs 
    let topic = OutlandsRegistry.interface.events.NewHero.topic
    let logRes = await logCheck(provider,OutlandsRegistry.address,topic)
    //roll through each 
    logRes.forEach(log=>{
        //now pull data fron log 
        let rawLog = OutlandsRegistry.interface.parseLog(log)
        //go to next if not loaded
        let {player, i, plane} = rawLog.values
        //get the long eth token id 
        let hex = "0x80000000000000000000000000000002" + i.toNumber().toString(16).padStart(32, "0")
        let _id = ethers.utils.bigNumberify(hex).toString()
        if (!ids.includes(_id))
            return
        //get hero data 
        data.planes.push(plane.toString())
        data.blocks.push(log.blockNumber)
    }
    )
    return data
}

module.exports = {
    provider,
    validateMessage,
    signData,
    OutlandsToken,
    OutlandsRegistry,
    outlandsTrouble,
    OutlandsUnitStatus,
    logCheck,
    getHeroData,
    utils: ethers.utils
}
