/**
 * Core UI functions are initialized in this file. This prevents
 * unexpected errors from breaking the core features. Specifically,
 * actions in this file should not require the usage of any internal
 * modules, excluding dependencies.
 */
const {remote, shell} = require('electron')
const $ = require('jquery')

/*$(function(){
})*/

document.addEventListener('readystatechange', function () {
    if (document.readyState === 'interactive'){
        console.log('UICore Initializing..')

        // Bind close button.
        document.getElementById("closeButton").addEventListener("click", function (e) {
            const window = remote.getCurrentWindow()
            window.close()
        })

        // Bind restore down button.
        document.getElementById("maximizeButton").addEventListener("click", function (e) {
            const window = remote.getCurrentWindow()
            if(window.isMaximized()){
                window.unmaximize()
            } else {
                window.maximize()
            }
        })

        // Bind minimize button.
        document.getElementById("minimizeButton").addEventListener("click", function (e) {
            const window = remote.getCurrentWindow()
            window.minimize()
        })

    }
}, false)

/**
 * Open web links in the user's default browser.
 */
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href)
})

/**
 * Opens DevTools window if you type "wcdev" in sequence.
 * This will crash the program if you are using multiple
 * DevTools, for example the chrome debugger in VS Code. 
 */
document.addEventListener('keydown', function (e) {
    if(e.keyCode == 73 && e.ctrlKey && e.shiftKey){
        let window = remote.getCurrentWindow()
        window.toggleDevTools()
    }
})