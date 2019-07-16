//set up worker
let worker = new Worker('src/shardsWorker.js')
//Display of terrain
import {plateMap} from "./terrain.js"
//chance
import "../lib/chance.min.js"
let chance = new Chance()
//Utilities
import {init as uInit} from "./utilities.js"
const utils = uInit("OutlandsPlanes2019")

//look for parameters
let params = (new URL(document.location)).searchParams

//setup data for current map 
let display = null

//creates the VUE js instance
const UIMain = new Vue({
  el: '#ui-main',
  data: {
    tid : 0 || Number(params.get('tid')),
  },
  mounted() {
    worker.postMessage({
      f: "generate",
      data : {
        opts : {
          what : "L",
          npts : 8000,
          seed: this.planeData.hash
        }
      }
    });
  },
  computed: {
    planeData () {
      return this.tid > -1 ? utils.planeData(this.tid) : {}
    }
  },
  methods: {}
})

const drawPlate = () => {
  //set size
  let svg = d3.select("#map svg").attr("width", 800).attr("height", 800)
  plateMap(svg,display)
}

worker.onmessage = function(e) {
  let d = e.data
  if (d.f === "generate") {
    display = Object.assign({
      get what () { return this.data.opts.what }
    },d)
    //check for which display
    if (display.what === "L") drawPlate();
    //remove spinner
    d3.select("#spinner").attr("class", "lds-dual-ring hidden")
  }
  else if (["saved","load"].includes(d.f)) {
    //load saved data
    //UIMain.activeObjects[d.what] = d.data
  }
}
