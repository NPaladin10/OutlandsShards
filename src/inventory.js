const TOKENS = {
  "1": {
    name: "Diamond",
    units: "ether"
  },
  "2": {
    name: "Emerald",
    units: "ether"
  },
  "3": {
    name: "Ruby",
    units: "ether"
  },
  "4": {
    name: "Sapphire",
    units: "ether"
  },
  "6": {
    name: "Chert",
    units: "wei"
  },
  "1000000": {
    name: "Explorers",
    units: "wei",
    range : [1000000,3000000]
  },
  "101": {
    name: "5 min cooldown",
    units: "wei"
  },
  "102": {
    name: "15 min cooldown",
    units: "wei"
  },
  "103": {
    name: "1 hr cooldown",
    units: "wei"
  },
  "104": {
    name: "3 hr cooldown",
    units: "wei"
  },
  "105": {
    name: "8 hr cooldown",
    units: "wei"
  },
  "106": {
    name: "1 day cooldown",
    units: "wei"
  },
  "201": {
    name: "Shard Info",
    units: "wei"
  },
  "1000000000": {
    name: "Shards",
    units: "wei",
    range : [1000000000,1000100000]
  },
  "1001000000": {
    name: "Regions",
    units: "wei",
    range : [1001000000,1001100000]
  },
}

const SKU = {
  "1": ["Hire a band of Explorers.", "1 Diamond", "1 Explorer"],
  "2": ["Split Diamond", "0.1 Diamond", "0.5 Emerald/Ruby/Sapphire"],
  "3": ["Shard Discovery", "1 Diamond", "100 Shard Info"],
  "4": ["5 min cooldown", "5 mDiamond", "5 min cooldown"],
  "5": ["15 min cooldown", "15 mDiamond", "15 min cooldown"],
  "6": ["1 hr cooldown", "55 mDiamond", "1 hr cooldown"],
  "7": ["3 hr cooldown", "160 mDiamond", "3 hr cooldown"],
  "8": ["8 hr cooldown", "400 mDiamond", "8 hr cooldown"],
  "9": ["1 day cooldown", "1 Diamond", "1 day cooldown"],
}

class InventoryManager {
  constructor(app) {
    this.app = app

    //set store
    Object.entries(SKU).forEach(sku => {
      Vue.set(app.UI.main.store, sku[0], {
        text : sku[1][0],
        toPay: sku[1][1],
        toBuy: sku[1][2]
      })
    })
  }
  get tokens() {
    return TOKENS
  }
  get NFTs() {
    return Object.entries(TOKENS).filter(T => T[1].range)
  }
  get NFTIds () {
    return Object.entries(TOKENS).filter(T => T[1].range).map(T => T[0])
  }
  getNFTId (id) {
    return Object.entries(TOKENS).filter(T => T[1].range).find(T => id > T[1].range[0] && id < T[1].range[1] )
  }
  get SKUs() {
    return SKU
  }
}

export {InventoryManager}
