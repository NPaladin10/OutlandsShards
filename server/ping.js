const ethers = require('ethers');

module.exports = (eth,resolvers) => {
    return ()=>{
        //check the current trouble period 
        eth.outlandsTrouble.currentPeriod().then(pd=>{
        })
    }
}
