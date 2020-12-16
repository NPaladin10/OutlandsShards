const UI = (app)=>{

  Vue.component("ui-staking", {
    template: "#ui-staking",
    props: ["now", "tokens", "allowance"],
    data: function() {
      return {
        claimTime : 22 * 60 * 60,
        lastCPXClaim : this.now,
        //staking 
        cpxAmt: 0,
        staked: [0, 0],
      }
    },
    mounted() {
      app.UI.staking = this
    },
    computed : {
      CPXdT () {
        let dT = this.now - this.lastCPXClaim, 
          s_num = this.claimTime > dT ? this.claimTime - dT : 0,
          hours   = Math.floor(s_num / 3600),
          minutes = Math.floor((s_num - (hours * 3600)) / 60),
          seconds = s_num - (hours * 3600) - (minutes * 60); 

        return {h:hours,m:minutes,s:seconds,mayClaim:s_num == 0}
      }
    },
    methods : {
      claimCosmic() {
        app.ETH.submit("CPXSimpleMinter", "mint", [])
      },
      claimDiamond () {
        app.ETH.submit("DiamondMinter", "mint", [])
      },
      stake () {
        let amt = app.ETH.utils.parseEther(this.cpxAmt) 
        app.ETH.submit("DiamondMinter", "stake", [amt.toString()])
      },
      unstake () {
        let amt = app.ETH.utils.parseEther(this.cpxAmt) 
        app.ETH.submit("DiamondMinter", "unstake", [amt.toString()])
      },
      approveDiamondMinter () {
        let eth = app.ETH
        //approve(spender, ammount)
        //1000000 ether 
        let amt = "1000000000000000000000000"
        eth.submit("CPXToken20", "increaseAllowance", [eth.contracts.DiamondMinter.address, amt])
      },
    }
  })
}

export {UI}
