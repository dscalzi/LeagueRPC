const ConfigManager = require('./configmanager.js')
const DiscordWrapper = require('./discordwrapper.js')
const EventEmitter = require('events')

let api = null
let observer = null
let running = false

class Observer extends EventEmitter {
    constructor(){
        super()
    }
}

function init(riot){
    api = riot
    observer = new Observer()
}

let detectTask = null
let dVInc = Number.MAX_SAFE_INTEGER

function start(){
    const inc = ConfigManager.getDetectionRefreshRate()
    dVInc = 1000*(ConfigManager.validateDetectionRefreshRate(inc) ? inc : ConfigManager.getDetectionRefreshRate(true))
    detectTask = setInterval(async () => {
        observer.emit('check')
        console.log('Checking for League process..')
        let v = api.isInProgress()
        if(v){
            console.log('League process detected.. validating data.')
            const gIn = await api.getCurrentGameInfo()

            if(gIn != null){
                DiscordWrapper.initRPC(gIn.queueType, gIn.mapName, gIn.champion, gIn.startTime)
                if(!(gIn.startTime > 0)){
                    // Game is loading, recheck for start time in a little bit.
                    _getCorrectTime()
                }
                _stop(0)
                _beginGameHook()
            } else {
                // TODO Display this to client (detected practice mode, can't setup rpc.)
                console.log('Unable to create rich presence for the current game type, only PVP games are supported.')
                _stop(0)
                _beginGameHook()
            }
        } else {
            observer.emit('tick', dVInc/1000)
        }
    }, dVInc)
    observer.emit('tick', dVInc/1000)
    return observer
}

let hookTask = null
let gVInc = Number.MAX_SAFE_INTEGER

function _beginGameHook(){
    const inc = ConfigManager.getGameRefreshRate()
    gVInc = 1000*(ConfigManager.validateGameRefreshRate(inc) ? inc : ConfigManager.getGameRefreshRate(true))
    hookTask = setInterval(async () => {
        observer.emit('check')
        let v = api.isInProgress()
        if(!v){
            console.log('Game Ended')
            _stop(1)
            start()
        } else {
            observer.emit('tick', gVInc/1000)
        }
    }, gVInc)
    observer.emit('tick', gVInc/1000)
}

const rTT = 60000

async function _getCorrectTime() {
    console.log('Game timer not yet started, rechecking in ' + rTT/1000 + ' seconds..')
    setTimeout(async () => {
        let v = api.isInProgress()
        if(v){
            console.log('Rechecking game timer..')
            const gIn = await api.getCurrentGameInfo()
            if(gIn != null){
                if(gIn.startTime > 0){
                    console.log('Updating game timer..')
                    DiscordWrapper.updateStartTime(gIn.startTime)
                } else {
                    _getCorrectTime()
                }
            }
        }
    }, rTT)
}

function _stop(...codes){
    if(codes.indexOf(0) > -1){
        if(detectTask != null){
            clearInterval(detectTask)
            detectTask = null
            dVInc = Number.MAX_SAFE_INTEGER
            observer.emit('gameEnded')
        }
    }
    if(codes.indexOf(1) > -1){
        if(hookTask != null){
            clearInterval(hookTask)
            hookTask = null
            DiscordWrapper.shutdownRPC()
            gVInc = Number.MAX_SAFE_INTEGER
            observer.emit('gameEnded')
        }
    }
}

function stop(){
    _stop(0, 1)
}

function getObserver(){
    return observer
}

module.exports = {
    init,
    start,
    stop,
    getObserver
}