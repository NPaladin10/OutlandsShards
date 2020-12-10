const SHARDSTEMPLATE = `
<div class="m-1 p-1 border">
    <h4>OutlandShards</h4>
    <form class="p-1">
        <h4>Set Region</h4>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">ID</span>
            </div>
            <input type="text" class="form-control" placeholder="int">
            <div class="input-group-prepend">
                <span class="input-group-text">Realm</span>
            </div>
            <input type="text" class="form-control" placeholder="int">
        </div>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">Anchors</span>
            </div>
            <input type="text" class="form-control" placeholder="array of 16 int">
            <div class="input-group-append">
                <button class="btn btn-outline-success" type="button" @click="setRegion()">Submit</button>
            </div>
        </div>
    </form>
    <form class="p-1">
        <h4>Generate Shard</h4>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">Region</span>
            </div>
            <input type="text" class="form-control" placeholder="int" v-model="genShardRegion">
            <div class="input-group-append">
                <button class="btn btn-outline-success" type="button" @click="genShard()">Submit</button>
            </div>
        </div>
    </form>
</div>
`

const STOREFRONT = `
<div class="m-1 p-1 border">
    <h4>Storefront</h4>
    <form class="p-1">
        <h4>Set SKU</h4>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">ID</span>
            </div>
            <input type="text" class="form-control" placeholder="int" v-model="id">
            <div class="input-group-prepend">
                <span class="input-group-text">Price Ids</span>
            </div>
            <input type="text" class="form-control" placeholder="List of price Ids" v-model="priceIds">
            <div class="input-group-prepend">
                <span class="input-group-text">AMT</span>
            </div>
            <input type="text" class="form-control" placeholder="List of price amts" v-model="priceAmts">
        </div>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">Get Tokens</span>
            </div>
            <input type="text" class="form-control" placeholder="List of token ids" v-model="ids">
            <div class="input-group-prepend">
                <span class="input-group-text">AMT</span>
            </div>
            <input type="text" class="form-control" placeholder="int" v-model="amounts">
            <div class="input-group-append">
                <button class="btn btn-outline-success" type="button" @click="setSKU()">Submit</button>
            </div>
        </div>
    </form>
</div>
`

const TREASUREMINTER = `
<div class="m-1 p-1 border">
    <h4>Treasure Minter</h4>
    <form class="p-1">
        <h4>Set Treasure</h4>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">IDs</span>
            </div>
            <input type="text" class="form-control" placeholder="list of ids" v-model="ids">
            <div class="input-group-append">
                <button class="btn btn-outline-success" type="button" @click="setTreasure()">Submit</button>
            </div>
        </div>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">Token/Amt</span>
            </div>
            <input type="text" class="form-control" placeholder="list of [id,amt]" v-model="tList">
        </div>
    </form>
</div>
`

const GATEKEEPER = `
<div class="m-1 p-1 border">
    <h4>Gatekeeper</h4>
    <form class="p-1">
        <h4>Grant Role</h4>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">Role</span>
            </div>
            <select class="custom-select" v-model="role">
              <option v-for="(r,id) in roles" :value="id">{{r}}</option>
            </select>
            <div class="input-group-prepend">
                <span class="input-group-text">Address</span>
            </div>
            <input type="text" class="form-control" placeholder="address" v-model="address">
            <div class="input-group-append">
                <button class="btn btn-outline-success" type="button" @click="grantRole()">Submit</button>
            </div>
        </div>
    </form>
    <form class="p-1">
        <h4>Set NFT</h4>
        <div class="input-group">
            <div class="input-group-prepend">
                <span class="input-group-text">NFT ID</span>
            </div>
            <input type="text" class="form-control" placeholder="id number" v-model="NFTId">
            <div class="input-group-prepend">
                <span class="input-group-text">NFT Max</span>
            </div>
            <input type="text" class="form-control" placeholder="max number of NFT" v-model="NFTMax">
            <div class="input-group-append">
                <button class="btn btn-outline-success" type="button" @click="setNFT()">Submit</button>
            </div>
        </div>
    </form>
</div>
`


const UI = (app)=>{

  Vue.component("ui-eth-admin-gatekeeper", {
    template: GATEKEEPER,
    data: function() {
      return {
        address : "",
        role : "",
        roles : {
          "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6" : "Minter",
          "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848" : "Burner"
        },
        NFTId : 0,
        NFTMax : 0
      }
    },
    computed: {},
    methods: {
      grantRole() {
        app.ETH.submit("Gatekeeper", "grantRole", [this.role, this.address])
      },
      setNFT () {
        app.ETH.submit("Gatekeeper", "setNFT", [this.NFTId, this.NFTMax])
      }
    }
  })

  Vue.component("ui-eth-admin-treasure", {
    template: TREASUREMINTER,
    data: function() {
      return {
        ids : "",
        tList : ""
      }
    },
    computed: {},
    methods: {
      setTreasure() {
        let ids = this.ids.split(",")
        let t = this.tList.split("],[")
      },
    }
  })

  Vue.component("ui-eth-admin-shards", {
    template: SHARDSTEMPLATE,
    data: function() {
      return {
        genShardRegion: 1
      }
    },
    computed: {},
    methods: {
      setRegion() {},
      genShard() {
        app.ETH.submit("OutlandsShards", "generateShard", [this.genShardRegion])
      }
    }
  })

  Vue.component("ui-eth-admin-storefront", {
    template: STOREFRONT,
    data: function() {
      return {
        id: 0,
        priceIds: "",
        priceAmts: "",
        ids : "",
        amounts : ""
      }
    },
    computed: {},
    methods: {
      setSKU() {
        let pIds = this.priceIds.split(",").map(s => s.trim()),
          pAmts = this.priceAmts.split(",").map(s => s.trim()),
          ids = this.ids.split(",").map(s => s.trim()),
          amts = this.amounts.split(",").map(s => s.trim()),
          data = [this.id,pIds,pAmts,ids,amts];

        app.ETH.submit("Storefront1155", "setSKU", data)
      }
    }
  })

}

export {UI}
