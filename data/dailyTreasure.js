const PERIODS = [10*60, 4*3600, 22*3600] // in seconds

const QTY = [1,1,1,1,2,2,2,3] // number to be given 

/*
  Daily, what may be given and qty  
*/
const TREASURE = {
  "0" : [["emd",0.1],["rby",0.1],["sph",0.1],["crt",20],["c5m",1]],
  "1" : [["emd",5],["rby",5],["sph",5],["crt",1000],["c3h",1],["c1h",3]],
  "2" : [["dmd",0.5],["emd",15],["rby",15],["sph",15],["crt",3000],["c3h",4],["c8h",1]],
} 

/*
  Free treasure
  {
    "T" : [], - array of [type, qty]
    "until" : number, - time 
    "all" : bool - give all or random pick   
  } 
*/
const FREE = {
  "0" : {
    "T" : [["dmd", 3]],
    "until" : 9999999999,
    "all" : true 
  }
}

export {PERIODS, QTY, TREASURE, FREE}
