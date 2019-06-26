//D3
importScripts('../lib/d3.v5.min.js'); 
importScripts('../lib/d3-delaunay.min.js'); 
//localforage
importScripts('../lib/localforage.1.7.1.min.js');
//chance RNG 
importScripts('../lib/chance.min.js'); 
//plate gen 
importScripts('terrainGenerate.js'); 
//names 
importScripts('nameGenerate.js'); 

//Save db for Indexed DB - localforage
const DB = localforage.createInstance({ name: "OP", storeName: "OutlandsPlanes" })

const TN = NameGen.nameBases.length
const PI = Math.PI

const GEN = {
  L(data) {
    opts = data.opts || {}
    opts.npts = opts.npts || 8000
    opts.ncities = 15
    opts.nterrs = 5

    let map = TerrainGenerate(opts)

    postMessage({
      f : "generate",
      data,
      map : map
    });
  },
}

//Handle loading saving and loading 
let state = null
let activeObjects = {
}

DB.getItem("state").then(function(savedState) {
  //check if it exists
  if(!savedState) {
    let hash = chance.hash()
    savedState = {
      time : Date.now(),
      lastSave : hash,
      saves : [hash]
    }
  }
  else {
    //update time
    savedState.time = Date.now()
  }
  //save state
  DB.setItem("state",savedState)
  state = savedState
  //pull saved data 
  for(let x in activeObjects){
    DB.getItem(state.lastSave+"."+x).then(save => {
      activeObjects[x] = save || []
      //send to app 
      postMessage({
        f : "load",
        what : x,
        data : activeObjects[x]
      });
    })
  }
})

onmessage = function(e) {
  let d = e.data

  if(d.f === "generate") {
    //now generate
    GEN[d.data.opts.what](d.data) 
  }
  //save 
  else if(d.f === "save") {
    //get save objects
    let what = activeObjects[d.what]
    //find if it is there
    let i = what.findIndex(o => o.id == d.data.id)
    if(i == -1) what.push(d.data);
    else what[i] = d.data;
    //now save all objects 
    let where = state.lastSave+"."+d.what    
    DB.setItem(where,what)
    //notify 
    postMessage({
      f : "saved",
      what : d.what,
      data : what
    });
  }
  //delete
  else if(d.f === "delete"){
    //get save objects
    let what = activeObjects[d.what]
    //find if it is there - and delete
    let i = what.findIndex(o => o.id == d.data)
    if(i > -1) what.splice(i,1);
    //now save all objects 
    let where = state.lastSave+"."+d.what    
    DB.setItem(where,what)
    //notify 
    postMessage({
      f : "saved",
      what : d.what,
      data : what
    });
  }
}
