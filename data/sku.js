const SKU = [
  {
    "text" : "Hire an Adventurer",
    "cost" : [["dmd",1]],
    "item" : [["adv",1]],
    "minter" : "characters",
    "v" : 1 
  },
  {
    "text" : "Shard Information",
    "cost" : [["dmd",1]],
    "item" : [["sdi",100]] 
  },
  {
    "text" : "Split Diamond",
    "cost" : [["dmd",0.1]],
    "item" : [["emd",0.5],["rby",0.5],["sph",0.5]] 
  },
  {
    "text" : "5 minute cooldown",
    "cost" : [["dmd",0.005]],
    "item" : [["c5m",1]] 
  },
  {
    "text" : "15 minute cooldown",
    "cost" : [["dmd",0.015]],
    "item" : [["c15",1]] 
  },
  {
    "text" : "1 hour cooldown",
    "cost" : [["dmd",0.055]],
    "item" : [["c1h",1]] 
  },
  {
    "text" : "3 hour cooldown",
    "cost" : [["dmd",0.160]],
    "item" : [["c3h",1]] 
  },
  {
    "text" : "8 hour cooldown",
    "cost" : [["dmd",0.4]],
    "item" : [["c8h",1]] 
  },
  {
    "text" : "1 day cooldown",
    "cost" : [["dmd",1]],
    "item" : [["c1d",1]] 
  },
]

const FREETREASURE = {
  "0" : {
    "title" : "Welcome Package",
    "text" : "Free treasure to help you start playing.",
    "T" : [["dmd", 3]],
    "until" : 9999999999,
    "all" : true 
  }
}

export {SKU, FREETREASURE}