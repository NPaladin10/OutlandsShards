//outlands data 
import*as OutlandsCore from "../data/outlands.js"

const ZERO = "0x0000000000000000000000000000000000000000"

const poll = (app,eth)=>{
    //count ticks 
    let tick = 0

    //data to call later
    let OS, nShards = 0, all = [], owns = [];

    const transfer = (from,to,tId)=>{
        //convert id 
        let id = tId.toNumber()
        
        //new shard
        if (from == ZERO) {     
            //push to all 
            if(!all.includes(id)) all.push(id)
            //check for owner 
            if (eth.address == to && !owns.includes(id))
                owns.push(id)
        }
        //burn shard
        else if(to == ZERO) {
            let i = all.indexOf(id)
            let j = owns.indexOf(id)
            all.splice(i,1)
            if(j > -1) owns.splice(j,1)
        }
        //remove ownership
        else if(from == eth.address) {
            let j = owns.indexOf(id)
            owns.splice(j,1)
        }
    }

    const load = (res)=>{
        res.forEach(tx=>{
            let {args} = tx
            transfer(args.from, args.to, args.tokenId)
        }
        )

        app.UI.main.shards_eth = all.map(id => app.format.shard_eth(OS.address, id))
    }

    //return polling function 
    return ()=>{
        let oneMin = 2 * 60
        //set OS 
        OS = eth.contracts.ShardV1

        if (tick == 0) {
            OS.on("Transfer", (from,to,tId) => {
                transfer(from,to,tId)
                //notify 
                if(eth.address == to){
                    app.simpleNotify("You have claimed shard #"+tId.toString(),"success")
                }
            })

            //pull initial
            OS.queryFilter("Transfer").then(load)
        }

        //poll after certain time 
        if ((tick % oneMin) == 0) {//poll for period
            app.UI.main.shards_eth = all.map(id => app.format.shard_eth(OS.address, id)) 
        }

        //tick 
        tick++
    }
}

export {poll}
