import {ActionManager} from "./action.js" //handle actions and UI of characters/actors 

//outlands data 
import*as OutlandsCore from "../data/outlands.js"

//generators 
import {ShardGen} from "../gen/shard.js"
import {AdventurerGen} from "../gen/adventurer.js"

/*
  Text Formatting
*/

const ADVENTURERSKILLS = ["Academic", "Diplomat", "Explorer", "Engineer", "Rogue", "Soldier"]

const FormatManager = (app)=>{
  
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
        return this._shard ? shard(this._shard) : null 
      } 
    })
  }
  const _hasHome = (actor) => {
    //define shard 
    Object.defineProperty(actor, 'home', { get: function() { 
        return this._home ? shard(this._home) : null 
      } 
    })
  }

  const adventurer = (data)=>{
    //generate and assign 
    let _adv = Object.assign(data, _idSplit(data.id), {
      what: "Adventurer",
    }, AdventurerGen(app, data))

    //set skills 
    _adv.skills = {
      ids: _adv._skills,
      text: Object.keys(_adv._skills).map(si=>ADVENTURERSKILLS[Number(si)]).join("/")
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
      alignment: OutlandsCore.ALIGNMENTS[_shard._alignment],
      safety: OutlandsCore.SAFETY[_shard._safety],
      climate: OutlandsCore.CLIMATES[_shard._temp],
      realmName: OutlandsCore.REALMS[_shard._realm].name,
      //find any adventurers for hire 
      get advForHire() {
        //get any adventurers for hire 
        let advSeed = localStorage.getItem("adv." + this.id)
        return !advSeed ? null : adventurer({
          id: advSeed,
          _home: this.id
        })
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
