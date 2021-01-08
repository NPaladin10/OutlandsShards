import {TOKENS} from "./tokenlist.js"
import {SKU} from "./sku.js"

const Storefront = (app) => {
  
  let GK = app.gatekeeper

  const buy = (id, data) => {
    //pull sku data 
    let {cost, item, minter} = SKU[id]

    //burn tokens
    if(GK.burn(cost)) { 
      if(minter){
        //call mint on NFT creator
        app[minter].mint(data)
      }
      else {
        //standard token mint 
        GK.mint(item) 
      }
      
      return true 
    }
    
    return false
  }

  app.server.buy = buy
}

export {Storefront}