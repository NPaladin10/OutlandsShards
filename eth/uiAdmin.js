const MULTI = `
<div class="m-1 p-1 border">
  <form class="p-1">
    <div class="input-group">
      <select class="custom-select" v-model="contract">
        <option v-for="c in contracts">{{c}}</option>
      </select>
      <select class="custom-select" v-model="fId">
        <option v-for="(f,i) in cFunctions" :value="i" v-if="f.type == 'function'">{{f.name}}</option>
      </select>
    </div>
    <div class="input-group" v-for="(iv,i) in inputs">
      <div class="input-group-prepend">
        <span class="input-group-text">{{iv.name}}</span>
      </div>
      <input type="text" class="form-control" :placeholder="iv.type" v-model="iValues[i]">
    </div>
    <button class="btn btn-outline-success btn-block" type="button" v-if="showSubmit" @click="submit()">Submit</button>
  </form>
</div>
`


const UI = (app, eth)=>{
  
  Vue.component("ui-eth-admin-multi", {
    template: MULTI,
    data: function() {
      return {
        abi : eth.ABI,
        contract : "",
        fId: -1,
        iValues : []
      }
    },
    computed: {
      contracts () {
        return Object.keys(this.abi)
      },
      cFunctions () {
        return this.contract == "" ? [] : this.abi[this.contract]
      },
      inputs () {
        if(this.fId < 0) return []
        let f = this.abi[this.contract][Number(this.fId)]
        
        //set iValues
        this.iValues = f.inputs.map(iv => "")

        return f.inputs
      },
      showSubmit () {
        return this.contract != "" && this.fId > -1
      }
    },
    methods: {
      submit () {
        let f = this.abi[this.contract][Number(this.fId)]
        //format input data 
        let data = this.iValues.map((d,i) => {
          let input = this.inputs[i]

          if(input.type.includes("][]")) {
            //nested arrays
            return d.slice(1,-1).split("],[").map(t => t.split(","))
          }
          else if (input.type.includes("[]")) {
            //regular array
            return d == "" ? [] : d.split(",").map(s => s.trim()) 
          }
          else if (input.type == "address") {
            return  d == "" ? eth.constants.AddressZero : d 
          }

          return d 
        })

        eth.submit(this.contract, f.name, data).then(res => {  
          //let reward = res.logs.map((log) => iface.parseLog(log)) 
          console.log(res)
        })
      }
    }
  })
  
}

export {UI}
