const ethers = require('ethers');

module.exports = (eth,resolvers) => {
    return ()=>{
        //check the current trouble period 
        eth.outlandsTrouble.currentPeriod().then(pd=>{
            let period = pd.toNumber()
            eth.outlandsTrouble.countOfChallenges().then(n=>{
                n = n.toNumber()
                //loop through challenges 
                for (let i = 0; i < n; i++) {
                    let r = resolvers.challengeCheck(i)
                    console.log(r)
                }
            })
        })
    }
}
