const { Client } = require('discord-rpc')

let rpc = new Client({ transport: 'ipc' })

client.subscribe('ACTIVITY_SPECTATE', ({ secret }) => {
    console.log('should spectate game with secret:', secret);
})

rpc.on('ready', () => {
    activity = {
        details: 'Ranked Solo/Duo',
        state: 'Summoner\'s Rift',
        largeImageKey: '131',
        largeImageText: 'Diana',
        smallImageKey: 'league-logo',
        smallImageText: 'LeagueRPC',
        startTimestamp: new Date().getTime() / 1000,
        instance: false,
        spectateSecret: 'YrHIX1zSujLMSzEHxG3fmLMBfF5wONzV',
        matchSecret: '2690157370'
    }
    rpc.setActivity(activity)
    console.log('test')
})

rpc.login({clientId: '394534740902019094'}).catch(error => {
    console.log(error)
    if(error.message.includes('ENOENT')) {
        console.log('Unable to initialize Discord Rich Presence, no client detected.')
    } else {
        console.log('Unable to initialize Discord Rich Presence: ' + error.message, error)
    }
})

setTimeout(function(){
    if(!rpc) return
    rpc.clearActivity();
    rpc.destroy()
    rpc = null
    activity = null
}, 45000)