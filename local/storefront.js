import {TOKENS} from "../data/tokenlist.js"
import {SKU} from "../data/sku.js"

const Storefront = (app) => {
  
  let GK = app.server.gatekeeper

  const buy = async (player, data) => {
    //pull sku data 
    let {cost, item, minter, v = 1} = SKU[data.id]

    //burn tokens
    let burn = await GK.burn(player, cost) 
    if(burn) { 
      if(minter){
        //add nft 
        data.nft = item[0][0]+"."+v
        //call mint on NFT creator
        return app.server[minter].mint(player, data)
      }
      else {
        //standard token mint 
        GK.mint(player, item) 
        //success
        return {
          success : true,
          data : item 
        }
      }
    }
    
    //no success 
    return {
      success : false,
      reason : "Not enough tokens." 
    } 
  }

  app.server.calls.buy = (call) => {
    let {player, data} = call 
    return buy(player, data)
  }
}

export {Storefront}