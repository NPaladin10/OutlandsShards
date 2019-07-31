const FACTIONS = [{
  "id": 1,
  "name": "Aboleth",
  "color": "#1E90FF",
  "aspects" : ["Clever","Engineers","Transmutation"],
  "cfw": [3, 2, 3],
  "forces": ["Three eyed", "tentacled fish sorcerers; crab-centaur brutes; eel-people vassals"],
  "text": "Power hungry rulers of the ocean depths."
}, {
  "id": 2,
  "name": "Archons",
  "color": "#C0C0C0",
  "vast": "Khulay",
  "lang": "Arabic",
  "aspects" : ["Careful","Fighters",""],
  "cfw": [2, 4, 3],
  "forces": ["Dour", "highly skilled soldiers; Empathic", "incorruptible judges; clairvoyant", "connected investigators"],
  "text": "Judges and police of the vast frontiers of the Universe."
}, {
  "id": 3,
  "name": "Asgardian",
  "color": "#DAA520",
  "vast": "Valldalen",
  "lang": "Nordic",
  "aspects" : ["Forceful","Fighters",""],
  "cfw": [3, 5, 3],
  "forces": ["Battle scarred veteran; flashy", "lightning weilding evoker; boisterous brawny warrior"],
  "text": "Vigilant warriors locked in an eternal war with the Titans and Giants."
}, {
  "id": 4,
  "name": "Blackflame",
  "color": "#8B0000",
  "aspects" : ["Forceful","Fighters","Fire"],
  "cfw": [2, 5, 3],
  "forces": ["Onyx armored", "fire giant reaver; fire wyrms; orc shock troopers"],
  "text": "Giant ravagers - they would burn the whole Universe with fire given the opportunity."
}, {
  "id": 5,
  "name": "Blood of Tiamat",
  "color": "#DC143C",
  "npc": "Azure Desert Fire",
  "vast": "Gahreb Desert",
  "lang": "Arabic",
  "aspects" : ["Forceful","Fighters","Evocation"],
  "cfw": [3, 5, 4],
  "forces": "Titanic chromatic dragon tyrants; Haughty Dragonborn proxies; Sharp eyed hunting drakes",
  "text": "Dragon tyrants who used to serve the fallen queen."
}, {
  "id": 6,
  "name": "Deva",
  "color": "#FFA500",
  "vast": "Ajayameru",
  "lang": "Hindi",
  "aspects" : ["Flashy","Scholars","Divination"],
  "cfw": [2, 2, 3],
  "text": "Esoteric elementals whose quest is to uncover the secrets of the Universe."
}, {
  "id": 7,
  "name": "Fae",
  "color": "#20B2AA",
  "vast": "Grwarthaf",
  "lang": "Gaelic",
  "aspects" : ["Quick","Rogues",""],
  "cfw": [2, 1, 2],
  "text": "Free spirited embodiments of nature."
}, {
  "id": 9,
  "name": "Goblyns",
  "color": "#808000",
  "aspects" : [],
  "cfw": [1, 2, 0],
  "text": "Animalistic beings made from the elements themselves"
}, {
  "id": 10,
  "name": "Guardians",
  "color": "#FFD700",
  "vast": "Ileje",
  "lang": "Swahili",
  "aspects" : [],
  "cfw": [2, 3, 4],
  "text": "Roving protectors of the innocent and oppressed."
}, {
  "id": 11,
  "name": "Jade Empire",
  "color": "#3CB371",
  "vast": "Xincai",
  "lang": "Chinese",
  "aspects" : [],
  "cfw": [4, 3, 5],
  "text": "Scolars, merchants and mystics seeking to return order to the Universe."
}, {
  "id": 12,
  "name": "Mechans",
  "color": "#800080",
  "vast": "Epsilon Seven",
  "lang": "English",
  "aspects" : [],
  "cfw": [2, 4, 5],
  "text": "Forge Worlds, Primes, Hedrons"
}, {
  "id": 13,
  "name": "Myr",
  "color": "#00008B",
  "aspects" : [],
  "cfw": [3, 2, 3],
  "text": "Shadow sorcerers who scour the Known Universe for powerful relics of the past."
}, {
  "id": 14,
  "name": "Olympian",
  "color": "#F08080",
  "vast": "Novus Olympus",
  "lang": "Greek",
  "aspects" : [],
  "cfw": [3, 3, 5],
  "text": "Children of the Titans vacillating between idyl and epic. "
}, {
  "id": 15,
  "name": "Platinum Star",
  "color": "#DCDCDC",
  "vast": "Aomori",
  "lang": "Japan",
  "aspects" : [],
  "cfw": [3, 3, 3],
  "text": "Draconic paladins who serve the legacy of the fallen Bahamut."
}, {
  "id": 16,
  "name": "Sect",
  "color": "#ADFF2F",
  "aspects" : [],
  "cfw": [1, 2, 3],
  "text": "Cosmic devouring horde of large robotic insects."
}, {
  "id": 17,
  "name": "Shadowsteel Syndicate",
  "color": "#6A5ACD",
  "npc": "Nigel Urquest",
  "vast": "yes",
  "lang": "English",
  "aspects" : [],
  "cfw": [3, 1, 2],
  "text": "Renowned vice dealers, thieves, spies and assassins."
}, {
  "id": 18,
  "name": "StarHive",
  "color": "#9ACD32",
  "aspects" : [],
  "cfw": [1, 5, 1],
  "text": "Building sized monstrosities that only seen to devour and spawn new horrors."
}, {
  "id": 19,
  "name": "Sons of Ymir",
  "color": "#B0C4DE",
  "vast": "Svalbard",
  "lang": "Nodric",
  "aspects" : [],
  "cfw": [3, 3, 3],
  "text": "Giants who seek to ursurp the power given to to Asgardians."
}, {
  "id": 20,
  "name": "Starlords",
  "color": "#D2691E",
  "vast": "Chicomoztoc",
  "aspects" : [],
  "cfw": [2, 2, 3],
  "lang": "Nahuatl"
}, {
  "id": 21,
  "name": "Cult of Cronus",
  "color": "#2F4F4F",
  "aspects" : [],
  "cfw": [5, 2, 2],
  "text": "Servants of the imprisoned Titan Lord who are always seeking his freedom."
}, {
  "id": 22,
  "name": "Xaoti",
  "color": "#FF00FF",
  "cfw": [1, 2, 1],
  "aspects" : [],
  "text": "Chaos incarnate. No goals or one goal - create more chaos."
}, {
  "id": 23,
  "name": "Wardens",
  "color": "#8FBC8B",
  "vast": "Sankuru",
  "lang": "Swahili",
  "aspects" : [],
  "cfw": [4, 3, 2],
  "text": "Hunters always on the lookout for signs of ancient darkness."
}, {
  "id": 24,
  "name": "Worms",
  "color": "#F5DEB3",
  "cfw": [4, 1, 3],
  "aspects" : [],
  "text": "Insidious possessors, flesh warpers, and powers behind the throne."
}, {
  "id": 25,
  "name": "Yuloth",
  "color": "#BDB76B",
  "vast": "Kirov",
  "lang": "Russian",
  "aspects" : [],
  "cfw": [2, 3, 4],
  "text": "War profiteers, arms manufacturers, and dealers in dangerous relics."
}, ]
