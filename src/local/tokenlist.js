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
  "101": {
    name: "5 min cooldown",
    units: "wei",
    "cool" : 300
  },
  "102": {
    name: "15 min cooldown",
    units: "wei",
    "cool" : 900
  },
  "103": {
    name: "1 hr cooldown",
    units: "wei",
    "cool" : 3600
  },
  "104": {
    name: "3 hr cooldown",
    units: "wei",
    "cool" : 3*3600
  },
  "105": {
    name: "8 hr cooldown",
    units: "wei",
    "cool" : 8*3600
  },
  "106": {
    name: "1 day cooldown",
    units: "wei",
    "cool" : 24*3600
  },
  "201": {
    name: "Shard Info",
    units: "wei"
  },
  "1000000": {
    name: "Explorers",
    units: "wei",
    isNFT : true
  },
  "1000000000": {
    name: "Regions",
    units: "wei",
    isNFT : true
  },
  "1001000000": {
    name: "Shards",
    units: "wei",
    isNFT : true
  },
}

export {TOKENS}