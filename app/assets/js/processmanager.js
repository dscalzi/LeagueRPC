const exec = require('child_process').exec

//isRunning('League of Legends.exe', 'League of Legends', 'League of Legends').then((v) => console.log(v))

function isRunning(win, mac, linux){
    return new Promise(function(resolve, reject){
        const plat = process.platform
        const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
        const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
        if(cmd === '' || proc === ''){
            return false
        }
        exec(cmd, function(err, stdout, stderr) {
            resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
        })
    })
}

module.exports = {
    isRunning
}