const REALMS = [
  {
    "name": "The Outlands",
    "info": `
    <p>The Outlands is the largest Realm and the locals claim that once there 
    was only the Outlands and everything else was just a region within it. 
    Now it has seven regions: Orchards of Arcadia, Forests of Sun and Starlight, 
    Oceanus, Mount Olympus, Islands Beyond the World, Bottomless Depths, and Frostfell.  
    </p>
    `
  },
  {
    "name": "Celestia",
    "info":  `
    <p></p>
    `
  },
  {
    "name": "Underdark",
    "info":  `
    <p></p>
    `
  },
  {
    "name": "Blasted Reach of Gehenna",
    "info":  `
    <p></p>
    `
  }
]

const REGIONS = [
  {
    "name": "Orchards of Arcadia",
    "parent": "outlands",
    "info": `
    <p>Perfectly lined orchards; small, sleeping villages surrounded by fields; produce and fruit in abundance; communes dedicated to an ancient form of martial arts or magic.</p>
    `
  },
  {
    "name": "Forests of Sun and Starlight",
    "parent": "outlands",
    "info":  `
    <p>A mystical forest that is home to the fey. Ancient groves; trees of every description; small villages that disappear when you leave; teeming wildlife; vine choked ruins; mysterious lights dancing in the night; songs heard from a distance; houses in the trees.</p>
    `
  },
  {
    "name": "Oceanus",
    "parent": "outlands",
    "info":  `
    <p>A huge, sluggish river that connects the Outlands. A miles wide river; winding tributaries; lakes; isolated islands; river towns; swamps; catfish that can swallow boats.</p>
    `
  },
  {
    "name": "Mount Olympus",
    "parent": "outlands",
    "info":  `
    <p>Home of the Olympians. Picturesque mountain valleys; stately alabaster towns on mountainsides; vineyards as far as they eye can see; ancient and crumbling cities forgotten by time; arenas and coliseums built for sports of all kinds.</p>
    `
  },
  {
    "name": "Islands Beyond the World",
    "parent": "outlands",
    "info":  `
    <p>An endless ocean dotted with countless volcanic islands. Water as far as the eye can see; smoke rising from a slumbering volcano; isolated atolls; a pod of whales; small island villages.</p>
    `
  },
  {
    "name": "Bottomless Depths",
    "parent": "outlands",
    "info":  `
    <p>An underwater realm where there is no sky. Blue above and black below; city sized coral reefs suspended in the currents; tangled forests of free-floating kelp; teeming schools of fish.</p>
    `
  },
  {
    "name": "Ice Heart",
    "parent": "outlands",
    "info":  `
    <p>Endless winter; plains of drifting snow; jagged, frost covered peaks; chasms of ice that could swallow cities; lakes fed by thermal springs creating islands of life.</p>
    `
  },
  {
    "name": "Shores of the Silver Sea",
    "parent": "celestia",
    "info":  `
    <p>The slopes of the great mountain of Celestia that touch the Sea. Small costal islands; isolated coves with quaint villages; sheer cliffs that fall into the Sea; hidden grottos.</p>
    `
  },
  {
    "name": "Atlantis",
    "parent": "celestia",
    "info":  `
    <p>An endless chain of islands. Islands lost in the mist; cities rising from the waters; storms rolling in; island villas; villages whose life is the see; isolated wizard towers.</p>
    `
  },
  {
    "name": "Slopes of Tranquility",
    "parent": "celestia",
    "info":  `
    <p>Winding mountain valleys; breathtaking waterfalls; crisp mountain air; quiet farms; and soaring granite peaks.</p>
    `
  },
  {
    "name": "Lakes of Molten Iron",
    "parent": "gehenna",
    "info":  `
    <p>A vast lake of molten iron. Lakeside towns covered in soot; blistering heat; isolated smiths dedicated to their craft; water worth its weight in gold; endless sand dunes.</p>
    `
  },
  {
    "name": "Crags of Relentless Flame",
    "parent": "gehenna",
    "info":  `
    <p>A mountain chain of titanic volcanoes. Rivers of lava; gorges spanned by bridges; cities built near rare sources of water; isolated fortified complexes; the constant smell of ash and sulfur.</p>
    `
  },
  {
    "name": "Great Undermountain",
    "parent": "underdark",
    "info":  `
    <p>Caverns as big as mountains. Massive sunstones that turn bleak caverns into valleys of paradise; cities of hewn stone; smiths of fine metal and jewelry; villages of hard working people; forgotten tombs.</p>
    `
  },
  {
    "name": "Howling Caverns of Pandemonium",
    "parent": "underdark",
    "info":  `
    <p>Winding tunnels without end; a constant wind; stone that seems to absorb light; cities tunneled out of the earth; rivers rushing through caverns; mushrooms and fungus of all varieties; isolated predators waiting for prey.</p>
    `
  },
  {
    "name": "Chasm of Lost Souls",
    "parent": "underdark",
    "info":  `
    <p>An underground canyon complex that could cover the face of multiple worlds. Villages clinging to the side of cliffs; knife-edge trails; sheer drops into the dark; the sound of falling rock; massive crumbling bridges over nothingness; cliffs riddled with caves.</p>
    `
  },
  {
    "name": "Sunless Sea",
    "parent": "underdark",
    "info":  `
    <p>Submerged caverns; cities clinging to cavern ceilings over underground lakes; the constant sound of dripping water; slippery stone; strange lights; underwater cities lit by phosphorescence.</p>
    `
  }
]

const ANCHORS = ["Lair","Terrain","Town","Ruin","Site"]
const RISK = ["Low","Medium","High","Very High"]
const ANCHORRISK = [3,1,0,2,1]

export {REALMS,REGIONS,ANCHORS,RISK,ANCHORRISK}
