const {Client} = require('discord-rpc')

let rpc = new Client({ transport: 'ipc' })

rpc.on('ready', () => {
    activity = {
        details: 'Ranked Solo/Duo',
        state: 'Aatrox | 10/2/4',
        largeImageKey: '266',
        largeImageText: 'Aatrox',
        smallImageKey: 'league-logo',
        smallImageText: 'LeagueRPC',
        startTimestamp: new Date().getTime() / 1000,
        instance: false
    }
    rpc.setActivity(activity)
    console.log('test')
})

rpc.login('394534740902019094').catch(error => {
    if(error.message.includes('ENOENT')) {
            console.log('Unable to initialize Discord Rich Presence, no client detected.')
    } else {
            console.log('Unable to initialize Discord Rich Presence: ' + error.message, error)
    }
})

setTimeout(function(){
    if(!rpc) return
    rpc.setActivity({})
    rpc.destroy()
    rpc = null
    activity = null
}, 15000)