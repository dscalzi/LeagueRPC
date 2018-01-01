const fs = require('fs')
const path = require('path')

const sysRoot = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')
const dataPath = path.join(sysRoot, 'LeagueRPC')

function ensureDirectoryExists(){
    if(!fs.existsSync(dataPath)){
        console.log('Creating data directory at', dataPath)
        fs.mkdirSync(dataPath)
    }
}

function getDataPath(){
    return dataPath
}

module.exports = {
    ensureDirectoryExists,
    getDataPath
}