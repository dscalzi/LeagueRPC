const path = require('path')
const packager = require('electron-packager')
const electronInstaller = require('electron-winstaller')
const createDMG = require('electron-installer-dmg')

const iRegex = /\.git(ignore|modules)|\.npmignore|logs|README\.md|\.vscode|docs|builds|discord_assets|buildtool.js/

const appName = 'LeagueRPC'
const iconPath = path.join(__dirname, 'app', 'assets', 'images', 'league.ico')
const iconPathMac = path.join(__dirname, 'app', 'assets', 'images', 'league.icns')
const buildPath = path.join(__dirname, 'builds')

const p = process.argv[2] != null ? process.argv[2] : process.platform
const a = process.argv[3] != null ? process.argv[3] : process.arch

console.log(`Packaging ${appName} for ${p} ${a}..`)

packager({
    dir: '.', 
    overwrite: true, 
    out: buildPath,
    asar: true,
    name: appName,
    ignore: iRegex,
    icon: iconPath,
    prune: true,
    platform: p,
    arch: a
}, (err, appPaths) => {
    console.log(`Packaged ${p}-${a}`)
    if(err){
        console.log(err)
        return
    } else {
        if(p === 'win32'){
            // TODO Complete options (signature, etc)
            console.log(`Building ${p}-${a} installer..`)
            electronInstaller.createWindowsInstaller({
                appDirectory: appPaths[0],
                outputDirectory: path.join(buildPath, `${appName}-${p}-${a}-msi`),
                authors: 'Daniel Scalzi',
                exe: `${appName}.exe`,
                setupIcon: iconPath,
                setupExe: `${appName}.exe`,
                setupMsi: `${appName}.msi`
            }).then(() => {
                console.log(`${p}-${a} installer successfully built.`)
            }, (e) => {
                console.log('Error while building installer:', e.message)
            })
        } else if(p === 'darwin'){
            // TODO Test on macOS
            console.log(`Building ${p}-${a} installer..`)
            createDMG({
                appPath: path.join(appPaths[0], `${appName}.app`),
                name: appName,
                icon: iconPathMac,
                overwrite: true,
                debug: true,
                out: path.join(buildPath, `${appName}-${p}-${a}-dmg`)
            }, (err) => {
                if(err){
                    console.log('Error while building installer:', err.message)
                } else {
                    console.log(`${p}-${a} installer successfully built.`)
                }
            })
        }
    }
})