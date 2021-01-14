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

/*
<!--STAKING---------------------------------------------->
    <template id="ui-staking">
      <div class="container my-2" align="right">
        <h3 align="left">Cosmic Staking</h3>
        <button class="btn btn-block btn-info w-50" type="button" @click="approveDiamondMinter()" v-if="allowance['DiamondMinter']<100000">Approve Staking</button>
        <span v-if="tokens[0]">CPX: {{tokens[0]}}</span>
        <span v-if="tokens[1]">DMD: {{tokens[1].val.toFixed(2)}}</span>
        <div class="my-2">
          <button class="btn btn-outline-success btn-block" type="button" @click="claimCosmic()" :disabled="!CPXdT.mayClaim">
            <span v-if="!CPXdT.mayClaim">Claim Free Cosmic in {{CPXdT.h}}:{{CPXdT.m}}:{{CPXdT.s}}</span>
            <span v-if="CPXdT.mayClaim">Claim Free Cosmic!</span>
          </button>
        </div>
        <div class="input-group">
          <div class="input-group-prepend">
            <span class="input-group-text">CPX</span>
          </div>
          <input type="number" class="form-control" v-model="cpxAmt">
          <div class="input-group-append">
            <button class="btn btn-outline-success" type="button" @click="stake()" :disabled="cpxAmt == 0 || cpxAmt>tokens[0]">Stake Cosmic</button>
            <button class="btn btn-outline-success" type="button" @click="unstake()" :disabled="cpxAmt == 0 || cpxAmt>staked[0]">Unstake Cosmic</button>
          </div>
        </div>
        <div v-if="staked[0]>0">Staked: {{staked[0]}} | Available Diamond: {{staked[1].toFixed(5)}}</div>
        <button class="btn btn-outline-success btn-block" type="button" @click="claimDiamond()" :disabled="staked[1]==0">Claim Diamond</button>
      </div>
    </template>
    <!--END STAKING---------------------------------------------->
*/