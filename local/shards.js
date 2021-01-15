//generators 
import {ShardGen} from "../gen/shard.js"

//STAT ID 
//const ID_EID = 0, ID_OWNER = 1;
const ID_EXCOOL = 2

const ShardManager = (app)=>{

  let GK = app.server.gatekeeper

  /*
    Shards 
  */

  //set data
  const mint = async (player, data)=>{
    let {nft, seed} = data 
    let _id = nft + "." + seed

    //check if exists
    let exists = await GK.nftExists(_id) 
    if(exists) {
      //failure 
      return {
        success : false,
        reason : "Shard exists."
      }
    }
    else {
      //mint
      GK.mintNFT(player, nft, _id)
      
      return {
          success : true,
          data : {id:_id} 
      } 
    }
  }

  //set shard functions 
  app.server.shards = {
    mint
  }

  /*
    App level functions
  */

  app.shards = {}
}

export {ShardManager}
