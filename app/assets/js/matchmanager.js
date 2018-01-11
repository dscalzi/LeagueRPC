const ConfigManager = require('./configmanager.js')
const DiscordWrapper = require('./discordwrapper.js')
const EventEmitter = require('events')

let api = null
let observer = null
let running = false

const EVENTS = {
    ENABLED: 'enabled',
    DISABLED: 'disabled',
    TASK_RUN: 'check',
    TIMER_RESET: 'tick'
}

class Observer extends EventEmitter {
    constructor(){
        super()
    }
}

function init(riot){
    api = riot
    observer = new Observer()
}

let refreshTask = null
let vInc = null

function _clearTasks(){
    if(refreshTask != null){
        clearInterval(refreshTask)
        refreshTask = null
    }
    vInc = null
}

function _initDetectTask(){
    _clearTasks()

    const inc = ConfigManager.getDetectionRefreshRate()
    vInc = 1000*(ConfigManager.validateDetectionRefreshRate(inc) ? inc : ConfigManager.getDetectionRefreshRate(true))

    refreshTask = setInterval(() => _detectTask(), vInc)
    observer.emit(EVENTS.TIMER_RESET, vInc/1000)
}

async function _detectTask(){
    console.log('Checking for presence of game process.')
    observer.emit(EVENTS.TASK_RUN)

    let inProg = api.isInProgress()
    if(inProg){
        console.log('Game process detected, validating data.')

        const gIn = await api.getCurrentGameInfo()

        if(gIn != null){
            DiscordWrapper.initRPC(gIn.queueType, gIn.mapName, gIn.champion, gIn.startTime)
            if(!(gIn.startTime > 0)){
                // Game is loading, recheck for start time in a little bit.
                _getCorrectTime()
            }
            _initMonitorGameTask()
        } else {
            // TODO Display this to client (detected practice mode, can't setup rpc.)
            console.log('Unable to create rich presence for the current game type, only PVP games are supported.')
            _initMonitorGameTask()
        }
    } else {
        observer.emit(EVENTS.TIMER_RESET, vInc/1000)
    }
}

function _initMonitorGameTask(){
    _clearTasks()

    const inc = ConfigManager.getGameRefreshRate()
    vInc = 1000*(ConfigManager.validateGameRefreshRate(inc) ? inc : ConfigManager.getGameRefreshRate(true))

    refreshTask = setInterval(() => _monitorGameTask(), vInc)
    observer.emit(EVENTS.TIMER_RESET, vInc/1000)
}

async function _monitorGameTask() {
    observer.emit(EVENTS.TASK_RUN)
    let inProg = api.isInProgress()
    if(!inProg){
        console.log('Game process has ended, beginning detection cycle.')
        DiscordWrapper.shutdownRPC()
        _initDetectTask()
    } else {
        observer.emit(EVENTS.TIMER_RESET, vInc/1000)
    }
}

function enable(){
    _initDetectTask()
}

function disable(){
    _clearTasks()
    DiscordWrapper.shutdownRPC()
}

const rTT = 60000

async function _getCorrectTime() {
    console.log('Game start time not available, rechecking in ' + rTT/1000 + ' seconds..')
    setTimeout(async () => {
        let v = api.isInProgress()
        if(v){
            console.log('Rechecking game start time..')
            const gIn = await api.getCurrentGameInfo()
            if(gIn != null){
                if(gIn.startTime > 0){
                    console.log('Game start time found, reapplying..')
                    DiscordWrapper.updateStartTime(gIn.startTime)
                } else {
                    _getCorrectTime()
                }
            }
        }
    }, rTT)
}

function getObserver(){
    return observer
}

module.exports = {
    init,
    enable,
    disable,
    getObserver,
    EVENTS
}