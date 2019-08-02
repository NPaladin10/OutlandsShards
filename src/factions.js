/*
  Grasp, Reach, Sleight 
  either 2,0,-1 OR 1,1,-1
  Mood
  Tech
  Data 
*/

const FACTIONS = [{
  "id": 1,
  "isPlayer" : false,
  "name": "Aboleth",
  "color": "#1E90FF",
  "aspects" : ["Clever","Engineers","Transmutation"],
  "stats": [-1,1,1,0,0],
  "forces": ["Three eyed", "tentacled fish sorcerers; crab-centaur brutes; eel-people vassals"],
  "text": "Power hungry rulers of the ocean depths."
}, {
  "id": 2,
  "name": "Archons",
  "isPlayer" : true,
  "color": "#C0C0C0",
  "vast": "Khulay",
  "lang": "Arabic",
  "aspects" : ["Careful","Fighters",""],
  "stats": [1,1,-1,0,0],
  "forces": ["Dour", "highly skilled soldiers; Empathic", "incorruptible judges; clairvoyant", "connected investigators"],
  "text": "Judges and police of the vast frontiers of the Universe."
}, {
  "id": 3,
  "name": "Asgardian",
  "isPlayer" : true,
  "color": "#DAA520",
  "vast": "Valldalen",
  "lang": "Nordic",
  "aspects" : ["Forceful","Fighters",""],
  "stats": [2,0,-1,0,0],
  "forces": ["Battle scarred veteran; flashy", "lightning weilding evoker; boisterous brawny warrior"],
  "text": "Vigilant warriors locked in an eternal war with the Titans and Giants."
}, {
  "id": 4,
  "name": "Blackflame",
  "isPlayer" : false,
  "color": "#8B0000",
  "aspects" : ["Forceful","Fighters","Fire"],
  "stats": [2,0,-1,0,0],
  "forces": ["Onyx armored", "fire giant reaver; fire wyrms; orc shock troopers"],
  "text": `Giant ravagers - they would burn the whole Universe with fire given the 
  opportunity. They did their best to help spread the StarHive during the last war.`
}, {
  "id": 5,
  "name": "Blood of Tiamat",
  "isPlayer" : false,
  "color": "#DC143C",
  "npc": "Azure Desert Fire",
  "vast": "Gahreb Desert",
  "lang": "Arabic",
  "aspects" : ["Forceful","Fighters","Evocation"],
  "stats": [1,1,-1,0,0],
  "forces": "Titanic chromatic dragon tyrants; Haughty Dragonborn proxies; Sharp eyed hunting drakes",
  "text": `Dragon tyrants who served Tiamat - the Fallen Queen. She created
  and released the StarHive to benefit from the chaos of the last war to conquer vast
  swaths of the Universe.`
}, {
  "id": 6,
  "name": "Deva",
  "isPlayer" : true,
  "color": "#FFA500",
  "vast": "Ajayameru",
  "lang": "Hindi",
  "aspects" : ["Flashy","Scholars","Divination"],
  "stats": [-1,1,1,0,0],
  "text": `Esoteric elementals whose quest is to uncover the secrets 
  of the Universe. Their theories enabled the creation of the Outlands.`
}, {
  "id": 7,
  "name": "Fae",
  "isPlayer" : true,
  "color": "#20B2AA",
  "vast": "Grwarthaf",
  "lang": "Gaelic",
  "aspects" : ["Quick","Rogues",""],
  "stats": [-1,1,1],
  "text": "Free spirited embodiments of nature."
}, {
  "id": 9,
  "name": "Goblyns",
  "isPlayer" : false,
  "color": "#808000",
  "aspects" : [],
  "stats": [1,-1,1,0,0],
  "text": "Animalistic beings made from the elements themselves"
}, {
  "id": 10,
  "name": "Guardians",
  "isPlayer" : true,
  "color": "#FFD700",
  "vast": "Ileje",
  "lang": "Swahili",
  "aspects" : [],
  "stats": [-1,1,1,0,0],
  "text": `Roving protectors of the innocent and oppressed. They spent 
  much of their resources and energy saving as many shards as they could.`
}, {
  "id": 11,
  "name": "Jade Empire",
  "isPlayer" : true,
  "color": "#3CB371",
  "vast": "Xincai",
  "lang": "Chinese",
  "aspects" : [],
  "stats": [-1,2,0,0,0],
  "text": `Scolars, merchants and mystics seeking to return order to the Universe. 
  The forces of Tiamat ursurped much of their territory during the last war.` 
}, {
  "id": 12,
  "name": "Mechans",
  "isPlayer" : true,
  "color": "#800080",
  "vast": "Epsilon Seven",
  "lang": "English",
  "aspects" : ["Forge Worlds, Primes, Hedrons"],
  "stats": [1,1,-1,0,0],
  "text": `Sentient robotic beings who are Universe's most renknowned 
  engineers and builders. They developed the technology that Shattered the worlds. 
  But they also created the technology that sustains the Outlands.`
}, {
  "id": 13,
  "name": "Myr",
  "isPlayer" : false,
  "color": "#00008B",
  "aspects" : [],
  "stats": [1,-1,1,0,0],
  "text": "Shadow sorcerers who scour the Known Universe for powerful relics of the past."
}, {
  "id": 14,
  "name": "Olympian",
  "isPlayer" : true,
  "color": "#F08080",
  "vast": "Novus Olympus",
  "lang": "Greek",
  "aspects" : [],
  "stats": [1,1,-1,0,0],
  "text": `Children of the Titans vacillating between idyl and epic. They
  lead the fight against the monsters of the StarHive in the last war. Their
  zeal also initiated the Shattering.` 
}, {
  "id": 15,
  "name": "Platinum Star",
  "isPlayer" : true,
  "color": "#DCDCDC",
  "vast": "Aomori",
  "lang": "Japan",
  "aspects" : [],
  "stats": [1,1,-1,0,0],
  "text": `Draconic paladins who serve the legacy of the fallen Bahamut.
   They fought along side the Jade Empire against the ruthless expansion of Tiamat during the last war.`
}, {
  "id": 16,
  "name": "Sect",
  "isPlayer" : false,
  "color": "#ADFF2F",
  "aspects" : [],
  "stats": [1,-1,1,0,0],
  "text": "Cosmic devouring horde of large robotic insects."
}, {
  "id": 17,
  "name": "Shadowsteel Syndicate",
  "isPlayer" : false,
  "color": "#6A5ACD",
  "npc": "Nigel Urquest",
  "vast": "yes",
  "lang": "English",
  "aspects" : [],
  "stats": [-1,0,2,0,0],
  "text": "Renowned vice dealers, thieves, spies and assassins."
}, {
  "id": 18,
  "name": "StarHive",
  "isPlayer" : false,
  "color": "#9ACD32",
  "aspects" : [],
  "stats": [2,0,-1,0,0],
  "text": `Building sized monstrosities that only seek to devour and 
  spawn new horrors. Their voracius appetite caused the Second Cosmic War
  and their relentless seeding of worlds with their spawn led to the Shattering.`
}, {
  "id": 19,
  "name": "Sons of Ymir",
  "isPlayer" : true,
  "color": "#B0C4DE",
  "vast": "Svalbard",
  "lang": "Nodric",
  "aspects" : [],
  "stats": [1,1,-1,0,0],
  "text": "Giants who seek to ursurp the power given to to Asgardians."
}, {
  "id": 20,
  "name": "Starlords",
  "isPlayer" : true,
  "color": "#D2691E",
  "vast": "Chicomoztoc",
  "aspects" : [],
  "stats": [-1,2,0,0,0],
  "lang": "Nahuatl",
  "text" : `Self proclaimed "gods" who look to shepherd less advanced societies.`
}, {
  "id": 21,
  "name": "Cult of Cronus",
  "isPlayer" : false,
  "color": "#2F4F4F",
  "aspects" : [],
  "stats": [1,-1,1,0,0],
  "text": "Servants of the imprisoned Titan Lord who are always seeking his freedom."
}, {
  "id": 22,
  "name": "Xaoti",
  "isPlayer" : false,
  "color": "#FF00FF",
  "stats": [1,-1,1,0,0],
  "aspects" : [],
  "text": "Chaos incarnate. No goals or one goal - create more chaos."
}, {
  "id": 23,
  "name": "Wardens",
  "isPlayer" : true,
  "color": "#8FBC8B",
  "vast": "Sankuru",
  "lang": "Swahili",
  "aspects" : [],
  "stats": [2,-1,0,0,0],
  "text": "Hunters always on the lookout for signs of ancient darkness."
}, {
  "id": 24,
  "name": "Worms",
  "isPlayer" : false,
  "color": "#F5DEB3",
  "stats": [-1,1,1,0,0],
  "aspects" : [],
  "text": "Insidious possessors, flesh warpers, and powers behind the throne."
}, {
  "id": 25,
  "name": "Yuloth",
  "isPlayer" : true,
  "color": "#BDB76B",
  "vast": "Kirov",
  "lang": "Russian",
  "aspects" : [],
  "stats": [-1,2,0,0,0],
  "text": "War profiteers, arms manufacturers, and dealers in dangerous relics."
}, ]

const UI = (app)=>{
  //establish factions for reference 
  app.factions = {
    _rep : {},
    get rep () { return this._rep },
    changeRep (id,mod) {
      //rep at id 
      let _rep = this._rep[id] || 0
      _rep += mod
      this._rep[id] = _rep 
      //check for plane - if so increase total rep
      id = id.split(".") 
      if(id[1].charAt(0) != "p") return 
      //total rep 
      let fid = id[0]
      let _trep = this._rep[fid] || 0
      _trep += mod 
      this._rep[fid] = _trep
    },
    byId (id) { return FACTIONS.find(f => f.id == id) },
    get all() { return FACTIONS },
    get player () { return FACTIONS.filter(f => f.isPlayer) },
    get nonPlayer () { return FACTIONS.filter(f => !f.isPlayer) },
    troubleSource () {
      let {player, nonPlayer} = app.factions
      //establish rng 
      let rng = new Chance("trouble."+app.day)
      //run for each 
      let n = app.planes.size 
      return Array.from({length: n}, (v, i) => {
        let type = rng.weighted(["np","p",""],[25,15,60])
        if(type == "np") return rng.pickone(nonPlayer)
        else if(type == "p") return rng.pickone(player)
        return null
      })
    }
  }

  Vue.component("faction-data",{
    props : ["F"],
    template: '#faction-data',
  })

  Vue.component("factions",{
    template: '#factions',
    data : function() {
      return {
        type : 0
      }
    },
    mounted () {
      app.UI.factions = this 
    },
    computed : {
      allFactions () { return FACTIONS },
      playerFactions () { return FACTIONS.filter(f => f.isPlayer) },
      nonPlayerFactions () { return FACTIONS.filter(f => !f.isPlayer) },
    },
    methods : {
    }
  })
}

export {UI}