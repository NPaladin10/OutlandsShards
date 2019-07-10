import {people} from "./peoples.js"
let seed = "OutlandsPlanes2019"

const cpxColors = ["Ruby","Citrine","Topaz","Emerald","Sapphire","Amethyst"]
const APPROACHES = ["Careful", "Clever", "Flashy", "Forceful", "Quick", "Sneaky"]
const SKILLGROUPS = ["Arcane", "Combat", "Diplomacy", "Exploration", "Science", "Thievery"]

/* Utilities 
*/
const arrayUnique = (arr) => {
  return arr.reduce((unq,v) => {
    if(!unq.includes(v)) unq.push(v)
    return unq
  },[])
}

const getBaseLog = (x, y) => {
  return Math.log(y) / Math.log(x);
}

//Difficulty of a challenge 1 - 10, based off of 1024
const difficulty = (n) => {
  if(n <= 256) return 1;
  else if(n <= 512) return 2;
  else if(n <= 648) return 3;
  else if(n <= 768) return 4;
  else if(n <= 875) return 5;
  else if(n <= 970) return 6;
  else if(n <= 1010) return 7;
  else if(n <= 1020) return 8;
  else if(n <= 1022) return 9;
  else return 10;
}
//common, uncommon, rare, very rare, mythic
const rarity = (n) => {
  if(n <= 128) return 1;
  else if(n <= 206) return 2;
  else if(n <= 251) return 3;
  else if(n <= 254) return 4;
  else return 5;
}
const hashToDecimal = (_hash, _id) => {
  //0x ofset
  let id = _id+1
  return parseInt(_hash.slice(id*2,(id*2)+2),16)
}
const rarityFromHash = (hash, i) => {
  return rarity(hashToDecimal(hash,i))
}
//For Vyper formatting
const uintToBytes = (i) => {
  return ethers.utils.hexZeroPad(ethers.utils.bigNumberify(i).toHexString(),32)
}

/* Hash Functions 
  Used for seeding and random generation  
*/

//Generate people for a world - not used in production
const peopleGen = (seed, r="c") => {
  let rng = new Chance(seed)

  let gen = {
    animal (t) {
      t = t || "c"
      let types = {    
        bug: ["termite", "tick", "snail", "slug", "worm", "ant", "centipede", "scorpion", "spider", "mosquito", "firefly", "locust", "dragonfly", "moth", "bee", "wasp"],
        land: ["snake", "lizard", "rat", "weasel", "boar", "dog", "fox", "wolf", "cat", "lion", "panther", "deer", "horse", "ox", "rhino", "bear", "gorilla", "ape", "mammoth"],
        air: ["chicken", "duck", "goose", "jay", "parrot", "gull", "pelican", "crane", "raven", "falcon", "eagle", "owl", "condor", "pteranodon"],
        water: ["jellyfish", "clam", "eel", "frog", "fish", "crab", "lobster", "turtle", "alligator", "shark", "squid", "octopus", "whale"]
      }
      let _t = rng.weighted(["bug","land","air","water"],[20,40,30,10])
      t = ["c","u","v","r","m"].includes(t) ? _t : t 
      let a = rng.pickone(types[t])
      return a.charAt(0).toUpperCase() + a.slice(1)
    },
    droid () {
        let shape = rng.pickone(["Humanoid", "Quad", "Insectoid", "Block", "Cylinder", "Sphere"])
        return shape + " Droid"
    },
    plant () {
        let shape = rng.pickone(["Flower","Grass","Vine","Tree","Fern","Conifer","Algae","Palm","Moss","Mushroom"])
        return shape + "-people"
    },
    ppl (r) {
      let what = null
      if(r == "c") {
        let types = [["Human"],["Bugbear","Drow","Dwarf","Elf","Gnoll","Gnome","Goblin",
          "Halfling","Hobgoblin","Human","Kobold","Lizardfolk","Minotaur",
          "Orc","Sahuagin"]]
        what = rng.weighted(types,[20,40])
      }
      else if (r == "u") {
        what = ["Ogre","Aasimar","Centaur","Chuul","Tiefling","Troll"]
      }
      return rng.pickone(what)
    },
    lna () {
        let one = this.animal("land")
        let two = this.animal()
        return one+"/"+two+" L'na"
    },
    genasi (r) {
        let e = rng.pickone(["Air","Darkness","Earth", "Fire","Light","Plant","Water","Storm","Winter"])
        let res = ["",e,"Genasi"]
        if(r == "u") res[0] = this.ppl("c");         
        else res[0] = this.ppl("u"); 
        return res.join(" ")         
    },
    axial (r) {
        let e = rng.pickone(["Air","Darkness","Earth", "Fire","Force","Light","Plant","Water","Storm","Winter"])
        let dm = rng.pickone(["Chaos","Creation","Destruction","Healing","Justice","Knowledge","Luck","Might","Nature","Secrecy","Transmutation"])
        let res = ["",dm+"/"+e,"Axial"]     
        if(r == "r") res[0] = this.ppl("c");         
        else res[0] = this.ppl("u"); 
        return res.join(" ")  
    },
    fey (r) {
        let e = rng.pickone(["Moon","Desert","Night","Mountain","Sun","Forest","Sea","Storm","Winter"])
        return e + (r == "r" ? " Fey" : " Eladrin")
    },
    wilder (r) {
        let anml = rng.pickone(["ant","centipede","bee","spider","butterfly","snake","rat","boar","wolf","lion","bear","panther","ox","rhino","crane","raven","eagle","owl","shark","alligator","dolphin"])
        anml = anml.charAt(0).toUpperCase() + anml.slice(1)
        return anml + (r == "u" ? " Were" : " Wilder")
    },
    guardian (r) {
        let e = null
        if(r == "r") e = rng.pickone(["Shield","Sword"])
        else if(r == "v") e = rng.pickone(["Staff","Crown"])
        return e + " Guardian"
    },
    giant (r) {
        let e = null
        if(r == "r") e = rng.pickone(["Forest","Stone"])
        else if(r == "v") e = rng.pickone(["Fire","Ice","Cloud","Sand"])
        else e = rng.pickone(["Darkness","Sea","Storm"])
        return e + " Giant"
    },
    dragon (r) {
        let e = null
        if(r == "v") e = rng.pickone(["Forest","Stone","Brass","Copper","Bronze","Ice","Fire","Black"])
        else e = rng.pickone(["Darkness","Sea","Storm","Gold","Silver"])
        return e + " Dragon"
    },
    c () {
        let what = rng.weighted(["ppl","animal"],[60,40])
        //add suffix as needed 
        return this[what]("c") + (what == "animal" ? "-people" : "")
    },
    u () {
        let what = rng.weighted(["ppl","plant","droid","lna","genasi","wilder"],[30,15,15,15,15,10])
        return this[what]("u")
    },
    r () {
        let what = rng.weighted(["giant","genasi","axial","fey","wilder","guardian"],[15,25,25,15,15,10])
        return this[what]("r")
    },
    v () {
        let what = rng.weighted(["giant","dragon","axial","fey","guardian"],[25,25,20,15,15])
        return this[what]("v")      
    },
    m () {
        let what = rng.weighted(["giant","dragon","Aboleth"],[40,50,10])
        return what == "Aboleth" ? "Aboleth" : this[what]("m")
    }
  }
  
  return gen[r]()
}

// Hero Data Generator 
const heroData = (heroId,planeId,baseHash,xp) => {
  //unique hash for hero 
  let hash = ethers.utils.solidityKeccak256(['string','uint256','bytes32'], [seed,heroId,baseHash])
  //pull planet id of plane - heroes are from a plane 
  let pi = planeData(planeId).pi
  //pull people data 
  let p = people[pi - 1]
  //first hash deterines rarity
  let r = rarityFromHash(hash, 0)
  //check against xp
  if(xp) {
    let xpr = Math.floor(getBaseLog(10,xp[1]))
    if(xpr > r) r = xpr
  }
  //second hash determines people
  let ppl = p[rarityFromHash(hash, 1)-1]
  //now the rest is through randomization
  let rng = new Chance(hash)
  let nc = rng.weighted([1,2],[7,3])
  let ac = rng.shuffle([0,1,2,3,4,5]).slice(0,nc)
  //skills
  let skills = rng.shuffle([0,1,2,3,4,5])
  let sN = skills.map(v => SKILLGROUPS[v])
  let skillsById = [0,0,0,0,0,0]
  //skill ranks
  let ranks = [r,r-1,r-2,r-2,r-3,r-3]
  //for presentation
  let sr = [[r,sN[0]],[r-1,sN[1]],[r-2,sN[2],sN[3]],[r-3,sN[4],sN[5]]]
  if(r >= 5) {
    ranks = [r,r-1,r-2,r-3,r-3,r-4]
    sr = [[r,sN[0]],[r-1,sN[1]],[r-2,sN[2]],[r-3,sN[3],sN[4]],[r-4,sN[5]]]
  }
  else if(r >= 7) {
    ranks = [r,r-1,r-2,r-3,r-4,r-5]
    sr = [[r,sN[0]],[r-1,sN[1]],[r-2,sN[2]],[r-3,sN[3]],[r-4,sN[4]],[r-5,sN[5]]]
  }
  //handle cross reference for quick bonus lookup
  ranks.forEach((v,i) => skillsById[skills[i]] = v)

  return {
    id: heroId, 
    plane: planeId, 
    r, ppl, 
    _xp: xp,
    name: "",
    approaches : ac.map(ci => APPROACHES[ci]),
    skills : sr,
    skillsById : skillsById
  }   
}

// Planet Data 
const planetHash = (i) => {
  return ethers.utils.solidityKeccak256(['string','string', 'uint256'], [seed, "planet",i]) 
}
const planetData = (i) => {
  let hash = planetHash(i)
  //people array
  //common, uncommon, rare, very rare, mythic 
  let people = ["c","u","r","v","m"].map((j,k) => peopleGen(hash+"-"+k,j)) 

  return {
    i : i,
    hash : hash,
    type : hashToDecimal(hash,0),
    state : hashToDecimal(hash,1),
    people : people,
    planes : []
  }
}

//Plane Data 
const planeTrouble = (period, i) => {
  let hash = ethers.utils.solidityKeccak256(['bytes32', 'string', 'uint256'], [planeHash(i), "trouble", period])
  //determine difficulty 
  let dn = (hashToDecimal(hash,1)*256+hashToDecimal(hash,0)) % 1024
  let d = difficulty(dn)
  //determine size
  let sz = [5,5,5,5,5,5,5,5,6,6,7,8,9,10,11,12][hashToDecimal(hash,2)%16]
  //determine primary approach 
  let a = hashToDecimal(hash,3) % 6
  //determine primary skill 
  let s = hashToDecimal(hash,4) % 6

  return {
    period, 
    id : i,
    diff : d,
    sz : sz,
    approach : APPROACHES[a],
    skill: SKILLGROUPS[s],
    skillId : s,
    approachId: a,
  }
}
const planeCPX = (hash) => {
  let cpxMag = [5,5,6,6,7,7,8,9,9,10,11,11,12,13,14,15]
  //number of CPX
  let _cpxI = hashToDecimal(hash,1) % 8
  let nCPX = [1,1,1,1,1,2,2,3][_cpxI]
  //designate array - 6 colors of CPX
  return Array.from({length: nCPX}, (v, i) => [1 + hashToDecimal(hash,(i*2)+2) % 6, cpxMag[hashToDecimal(hash,(i*2)+3) % 16]])
}
const planeHash = (i) => {
  if(i < 0) return ""
  //Vyper formatting for hash 
  return ethers.utils.solidityKeccak256(['bytes32', 'bytes32'], [ ethers.utils.id(seed), uintToBytes(i)])
}
const planeData = (i) => {
  let hash = planeHash(i)
  let pi = 0
  if(i < 256){
    pi = 1 + hashToDecimal(hash,0) % 32
  }

  return {
    i : i, 
    pi : pi,
    hash : hash,
    cpx : planeCPX(hash)
  }
}

//function to add planes and check for planets 
const addPlaneData = (i, planets, planes) => {
  let d = planeData(i)
  //check for planet 
  if(!planets.has(d.pi)) {
    planets.set(d.pi,planetData(d.pi))
  }
  let p = planets.get(d.pi)
  p.planes.push(i)

  planes.set(i,d)
}

//Initialize with a seed
const init = (_seed) => {
    seed = _seed

    return {
        planetData,
        planeHash,
        planeData,
        heroData,
        planeTrouble,
        addPlaneData
    }
} 

export {init}