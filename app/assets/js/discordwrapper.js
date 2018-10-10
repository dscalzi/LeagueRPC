const { Client } = require('discord-rpc')

let rpc
let activity

exports.initRPC = function(queueType, mapName, champion, startTime){
    rpc = new Client({ transport: 'ipc' })

    rpc.on('ready', () => {
        activity = {
            details: queueType,
            state: mapName,
            largeImageKey: champion.id.toString(),
            largeImageText: champion.name,
            smallImageKey: 'league-logo',
            smallImageText: 'LeagueRPC',
            startTimestamp: parseInt(startTime / 1000),
            instance: false
        }
    
        rpc.setActivity(activity)
    })

    rpc.login({clientId: '394534740902019094'}).catch(error => {
        if(error.message.includes('ENOENT')) {
            console.log('Unable to initialize Discord Rich Presence, no client detected.')
        } else {
            console.log('Unable to initialize Discord Rich Presence: ' + error.message, error)
        }
    })
}

exports.updateDetails = function(details){
    if(activity == null){
        console.error('Discord RPC is not initialized and therefore cannot be updated.')
    }
    activity.details = details
    rpc.setActivity(activity)
}

exports.updateStartTime = function(startTime){
    if(activity == null){
        console.error('Discord RPC is not initialized and therefore cannot be updated.')
    }
    activity.startTimestamp = parseInt(startTime / 1000)
    rpc.setActivity(activity)
}

exports.shutdownRPC = function(){
    if(!rpc) return
    rpc.clearActivity()
    rpc.destroy()
    rpc = null
    activity = null
}