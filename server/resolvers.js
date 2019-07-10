const {planeTrouble, heroData} = require('./utilities');
const ethers = require('ethers');

module.exports = (eth)=>{
    let {outlandsHeroes,outlandsTrouble} = eth 

    // next trouble period
    const advanceTrouble = () => {
      let overrides = {
        // The price (in wei) per unit of gas
        gasPrice: ethers.utils.parseUnits('5.0', 'gwei')
      };
      outlandsTrouble.nextPeriod(overrides).then(tx => {
        console.log("Tx submitted: "+tx.hash)
      })
    }

    

    //run the check on a particular current challenge
    const challengeCheck = (ci)=>{
        return new Promise((resolve,reject)=>{
            //works with the current period
            outlandsTrouble.currentPeriod().then(pd=>{
                getChallengeData(pd.toNumber(), ci).then(data=>{
                    resolve(resolveChallenge(data))
                }
                )
            }
            )
        }
        )
    }

    return {
        challengeCheck
    }
}
