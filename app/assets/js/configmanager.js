const fs = require('fs')
const path = require('path')
const CacheManager = require('./cachemanager.js')

const DEFAULT_CONFIG = {
    settings: {
        detectionRefreshRate: 15,
        gameRefreshRate: 30,
        runInBackground: true,
        autoStart: true
    },
    apikey: null
}

let config = null

/**
 * Save the current configuration to a file.
 */
exports.save = function(){
    const filePath = path.join(CacheManager.getDataPath(), 'config.json')
    fs.writeFileSync(filePath, JSON.stringify(config, null, 4), 'UTF-8')
}

/**
 * Load the configuration into memory. If a configuration file exists,
 * that will be read and saved. Otherwise, a default configuration will
 * be generated.
 */
exports.load = function(){
    const filePath = path.join(CacheManager.getDataPath(), 'config.json')

    if(!fs.existsSync(filePath)){
        config = DEFAULT_CONFIG
        exports.save()
    } else {
        try {
            config = JSON.parse(fs.readFileSync(filePath, 'UTF-8'))
        } catch(err){
            console.error('Error while loading settings. Values will be reset.', err)
            try{
                logCorruptConfig(filePath)
            } catch(ex){
                console.error('Could not log old config.', ex)
            }
            config = DEFAULT_CONFIG
            exports.save()
        }
    }
}

/**
 * Log a corrupted config file.
 * 
 * @param {string} fp - the path to the corrupted config file.
 */
function logCorruptConfig(fp){
    const dir = path.join(CacheManager.getDataPath(), 'corrupt')
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
    let dtv = (new Date()).toISOString().replace(/:/g, '')
    //dtv = dtv.substring(0, dtv.lastIndexOf('.')) + 'Z'
    const filePath = path.join(dir, 'config_' + dtv + '.json')

    console.log('Saving corrupt config to ', filePath)

    fs.writeFileSync(filePath, fs.readFileSync(fp, 'UTF-8'), 'UTF-8')
}

// User Configurable Settings

/**
 * Retrieve the rate at which the application will check for the presence of a game on
 * the user's account. Value is in seconds.
 * 
 * @param {Boolean} def - optional. If true, the default value will be returned.
 * @returns {Number} - the detection rate.
 */
exports.getDetectionRefreshRate = function(def = false){
    return !def ? config.settings.detectionRefreshRate : DEFAULT_CONFIG.settings.detectionRefreshRate
}

/**
 * Set the rate at which the application will check for the presence of a game on
 * the user's account. Value is in seconds.
 * 
 * @param {Number} rate - the new detection rate.
 */
exports.setDetectionRefreshRate = function(rate){
    config.settings.detectionRefreshRate = rate
}

/**
 * Validate a value for the detection refresh rate.
 * 
 * @param {any} value - a value to validate.
 */
exports.validateDetectionRefreshRate = function(value){
    return typeof value === 'number' && value % 1 === 0 && value >= 15 && value <= 3600
}

/**
 * Retrieve the rate at which the application will check for new data about the game currently
 * in progress on the the user's account. Value is in seconds.
 * 
 * @param {Boolean} def - optional. If true, the default value will be returned.
 * @returns {Number} - the game refresh rate.
 */
exports.getGameRefreshRate = function(def = false){
    return !def ? config.settings.gameRefreshRate : DEFAULT_CONFIG.settings.gameRefreshRate
}

/**
 * Set the rate at which the application will check for new data about the game currently
 * in progress on the the user's account. Value is in seconds.
 * 
 * @param {Number} rate - the new game refresh rate.
 */
exports.setGameRefreshRate = function(rate){
    config.settings.gameRefreshRate = rate
}

/**
 * Validate a value for the game refresh rate.
 * 
 * @param {any} value - a value to validate.
 */
exports.validateGameRefreshRate = function(value){
    return typeof value === 'number' && value % 1 === 0 && value >= 20 && value <= 300
}

/**
 * If the application should run in the background once closed.
 * 
 * @param {Boolean} def - optional. If true, the default value will be returned.
 * @returns {Boolean} - true if the app will run in the background, otherwise false.
 */
exports.getRunInBackground = function(def = false){
    return !def ? config.settings.runInBackground : DEFAULT_CONFIG.settings.runInBackground
}

/**
 * Set if the application should run in the background once closed.
 * 
 * @param {Boolean} val - true if the app will run in the background, otherwise false.
 */
exports.setRunInBackground = function(val){
    config.settings.runInBackground = val
}

/**
 * If the application should automatically start on system startup.
 * 
 * @param {Boolean} def - optional. If true, the default value will be returned.
 * @returns {Boolean} - true if the app automatically start, otherwise false.
 */
exports.getAutoStart = function(def = false){
    return !def ? config.settings.autoStart : DEFAULT_CONFIG.settings.autoStart
}

/**
 * Set if the application should automatically start on system startup.
 * 
 * @param {Boolean} val - true if the app automatically start, otherwise false.
 */
exports.setAutoStart = function(val){
    config.settings.autoStart = val
}