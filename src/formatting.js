import {ActionManager} from "./action.js" //handle actions and UI of characters/actors 

//outlands data 
import*as OutlandsCore from "../data/outlands.js"

//generators 
import {ShardGen} from "../gen/shard.js"
import {AdventurerGen} from "../gen/adventurer.js"
import {ElementalGen} from "../gen/elemental.js"
import {TroubleGen} from "../gen/trouble.js"

/*
  Text Formatting
*/

const ADVENTURERSKILLS = ["Academic", "Diplomat", "Explorer", "Engineer", "Rogue", "Soldier"]

const FormatManager = (app)=>{
  
  let UI = app.UI.main

  //establish action controll
  let actions = ActionManager(app)

  //split id into nft and seed 
  const _idSplit = (id) => {
    let _id = id.split(".")

    return {
      nft : _id[0] + "." + _id[1],
      v : _id[1],
      seed : _id[2]
    }
  }

  //add getter function for shard data 
  const _hasShard = (actor) => {
    //define shard 
    Object.defineProperty(actor, 'shard', { get: function() { 
        return this._shard ? UI.shards.find(s => s.id == this._shard) || shard(this._shard) : null 
      } 
    })
  }
  const _hasHome = (actor) => {
    //define shard 
    Object.defineProperty(actor, 'home', { get: function() { 
        return this._home ? UI.shards.find(s => s.id == this._home) || shard(this._home) : null 
      } 
    })
  }

  const elemental = (data) => {
    //generate and assign 
    let e = Object.assign(data, _idSplit(data.id), {
      what: "Elemental",
    }, ElementalGen(app, data))

    //has shard - add getter 
    _hasHome(e)
    
    return e  
  }

  const adventurer = (data)=>{
    //generate and assign 
    let _adv = Object.assign(data, _idSplit(data.id), {
      what: "Adventurer",
    }, AdventurerGen(app, data))

    //set skills 
    _adv.skills = {
      ids: _adv._skills,
      text: Object.entries(_adv._skills).map(e=>ADVENTURERSKILLS[Number(e[0])]+" "+e[1]).join("/")
    }

    //has shard - add getter 
    _hasShard(_adv)
    _hasHome(_adv)

    //actions 
    actions.adventurer(_adv)

    //return
    return _adv
  }

  //format explorer 
  const explorer = (data)=>{
    //generate and assign 
    let _e = Object.assign(data, _idSplit(data.id), {
      what: "Explorer",
    })

    //has shard - add getter 
    _hasShard(_e)
    _hasHome(_e)

    //actions 
    actions.explorer(_e)

    //set UI 
    return _e
  }

  const trouble = (tbl) => {
    tbl.skillText = ADVENTURERSKILLS[tbl.skill]
    tbl.cText = tbl._c.map(si => ADVENTURERSKILLS[si])

    return tbl
  }

  const shard = (_id)=>{
    //generate 
    let _shard = ShardGen(app, _id.split("."))
    
    //handle anchor 
    let {id, rarity} = _shard.anchor
    let risk = OutlandsCore.ANCHORRISK[id - 1]

    //add information 
    Object.assign(_shard.anchor, {
      text: OutlandsCore.ANCHORS[id - 1],
      risk: [risk, OutlandsCore.RISK[risk]]
    })

    //text and formatting 
    return Object.assign({
      get realm () {
        return OutlandsCore.REALMS[this._realm]
      },
      get terrain () {
        let altT = this.realm.altTerrain
          , t = this._terrain[0];

        return altT && altT[t] ? altT[t] : OutlandsCore.TERRAIN[t] 
      },
      alignment: OutlandsCore.ALIGNMENTS[_shard._alignment],
      safety: OutlandsCore.SAFETY[_shard._safety],
      climate: OutlandsCore.CLIMATES[_shard._temp],
      realmName: OutlandsCore.REALMS[_shard._realm].name,
      //see if actors are present 
      get characters () {
        return Object.values(app.UI.main.actors).filter(a => a._shard == this.id)
      },
      //find any adventurers for hire 
      get elementals() {
        //get any adventurers for hire 
        let eSeed = localStorage.getItem("ele." + this.id)
        return !eSeed ? null : elemental({
          id: eSeed,
          _home: this.id
        })
      },
      get trouble () {
        return this._trouble ? trouble(TroubleGen(app,this)) : null
      }
    }, _shard)
  }

  app.format = {
    adventurer,
    explorer,
    shard
  }
}

export {FormatManager}
