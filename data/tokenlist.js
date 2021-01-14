const TOKENS = {
  "dmd": {
    name: "Diamond",
    units: "ether"
  },
  "emd": {
    name: "Emerald",
    units: "ether"
  },
  "rby": {
    name: "Ruby",
    units: "ether"
  },
  "sph": {
    name: "Sapphire",
    units: "ether"
  },
  "crt": {
    name: "Chert",
    units: "wei"
  },
  "c5m": {
    name: "5 min cooldown",
    units: "wei",
    "cool" : 300
  },
  "c15": {
    name: "15 min cooldown",
    units: "wei",
    "cool" : 900
  },
  "c1h": {
    name: "1 hr cooldown",
    units: "wei",
    "cool" : 3600
  },
  "c3h": {
    name: "3 hr cooldown",
    units: "wei",
    "cool" : 3*3600
  },
  "c8h": {
    name: "8 hr cooldown",
    units: "wei",
    "cool" : 8*3600
  },
  "c1d": {
    name: "1 day cooldown",
    units: "wei",
    "cool" : 24*3600
  },
  "sdi": {
    name: "Shard Info",
    units: "wei"
  },
  "wai": {
    name: "Way Info",
    units: "wei"
  },
}

const NFT = {
  "exp": {
    name: "Explorer",
    units: "wei",
  },
  "adv": {
    name: "Adventurer",
    units: "wei",
  },
  "rgn": {
    name: "Region",
    units: "wei",
  },
  "srd": {
    name: "Shard",
    units: "wei",
  }
}

const formatTokenText = (list) => {
  return list.map(t => {
    let what = TOKENS[t[0]] ? TOKENS[t[0]].name : NFT[t[0]].name 
    return t[1] + " " + what
  })
}

export {TOKENS, NFT, formatTokenText}