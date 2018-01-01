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
        config = JSON.parse(fs.readFileSync(filePath, 'UTF-8'))
    }
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