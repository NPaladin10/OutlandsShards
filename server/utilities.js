const ethers = require('ethers');
//Seed for generation
const seed = "OutlandsPlanes2019"
/* Utilities 
*/
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

// Hero Data Generator 
const heroData = (i,tid,baseHash,planes) => {
  //unique hash for hero 
  let hash = ethers.utils.solidityKeccak256(['string','uint256','bytes32'], [seed,i,baseHash])
  //pull planet id of plane - heroes are from a plane 
  let pi = planes.get(tid).pi
  //pull people data 
  let p = people[pi - 1]
  //first hash deterines rarity
  let r = rarityFromHash(hash, 0)
  //second hash determines people
  let ppl = p[rarityFromHash(hash, 1)-1]
  //now the rest is through randomization
  let rng = new Chance(hash)
  let nc = rng.weighted([1,2],[7,3])
  let ac = rng.shuffle([1,2,3,4,5,6]).slice(0,nc)
  //skills
  let skills = rng.shuffle(SKILLGROUPS)
  //skill ranks
  let sr = [[r,skills[0]],[r-1,skills[1]],[r-2,skills[2],skills[3]],[r-3,skills[4],skills[5]]]

  return {
    i, tid, pi, r, ppl,
    approaches : ac.map(ci => APPROACHES[ci-1]),
    skills : sr
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
  let hash = ethers.utils.solidityKeccak256(['bytes32', 'string', 'uint256'], [planeHash(i), "trouble", i])
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
    period, i,
    diff : d,
    sz : sz,
    approach : a,
    skill: s 
  }
}
const planeCPX = (hash) => {
  let cpxMag = [5,5,6,6,7,7,8,9,9,10,11,11,12,13,14,15]
  //number of CPX
  let _cpxI = hashToDecimal(hash,1) % 8
  let nCPX = [1,1,1,1,1,2,2,3][_cpxI]
  //designate array - 6 colors of CPX
  return d3.range(nCPX).map(i => {
    return [1 + hashToDecimal(hash,(i*2)+2) % 6, cpxMag[hashToDecimal(hash,(i*2)+3) % 16]]
  })
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

module.exports = {
  planeHash, planeData, planeTrouble, 
  heroData
}
