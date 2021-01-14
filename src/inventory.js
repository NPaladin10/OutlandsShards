import {TOKENS, NFT} from "../data/tokenlist.js"
import {SKU} from "../data/sku.js"

const tokenFormat = (arr) => {
  let name = TOKENS[arr[0]] ? TOKENS[arr[0]].name : NFT[arr[0]].name
  return arr[1]+" "+name
}

class InventoryManager {
  constructor(app) {
    this.app = app

    //set store
    SKU.forEach((sku,i) => {
      Vue.set(app.UI.main.store, i, {
        text : sku.text,
        toPay: sku.cost.map(tokenFormat).join("/"),
        toBuy: sku.item.map(tokenFormat).join("/")
      })
    })
  }
  get tokens() {
    return TOKENS
  }
  get NFTs() {
    return Object.entries(TOKENS).filter(T => T[1].range)
  }
  get NFTIds () {
    return Object.entries(TOKENS).filter(T => T[1].range).map(T => T[0])
  }
  getNFTId (id) {
    return Object.entries(TOKENS).filter(T => T[1].range).find(T => id > T[1].range[0] && id < T[1].range[1] )
  }
  get SKUs() {
    return SKU
  }
}

export {InventoryManager}
