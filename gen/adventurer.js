const adventurerSkills = (adv)=>{
    let seed = app.eth.utils.id(app.params.seed + adv._home + adv._seed)

    const _d6 = (i)=>{
      return 1 + (hexToNumber(seed, i, i + 1) % 6)
    }

    //skill 
    let skills = [0, 0, 0]
    skills[0] = _d6(0)
    if (hexToNumber(seed, 1, 2) % 16 == 0) {
      //two skills
      skills[1] = _d6(2)

      //three skills  
      if (hexToNumber(seed, 3, 4) % 64 == 0) {
        skills[2] = _d6(4)
      }
    }

    //text
    let text = skills.filter(id=>id > 0).map(id=>ADVENTURERSKILLS[id - 1])

    //data formatting 
    adv.skills = {
      ids: skills,
      text
    }
    adv.cost = Math.pow(10, -2 + text.length)
  }