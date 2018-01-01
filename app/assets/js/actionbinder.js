const path = require('path')
const CacheManager = require(path.join(__dirname, 'assets', 'js', 'cachemanager.js'))
const ConfigManager = require(path.join(__dirname, 'assets', 'js', 'configmanager.js'))
const ProcessManager = require(path.join(__dirname, 'assets', 'js', 'processmanager.js'))
const RiotWrapper = require(path.join(__dirname, 'assets', 'js', 'riotwrapper.js'))

// Initialize a new RiotWrapper.
const riot = new RiotWrapper()

/*
 * App Startup and Initialization
 */

// Load elements.
let retryBtn, loadSpinner, loadText, loadDetails, loadDock

// Settings elements.
let settingsButton, summonerDock, settingsCancelButton, settingsSaveButton

// Setting Fields.
let detectionRefreshRate, gameRefreshRate, runInBackground, autoStart

document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete'){
        
        // Save the load screen elements.
        retryBtn = document.getElementById('retryLoad')
        loadSpinner = document.getElementById('loadSpinner')
        loadText = document.getElementById('loadText')
        loadDetails = document.getElementById('loadDetails')
        loadDock = document.getElementById('loadDock')

        // Save the settings elements.
        settingsButton = document.getElementById('settingsButton')
        summonerDock = document.getElementById('summonerDock')
        settingsCancelButton = document.getElementById('settingsCancelButton')
        settingsSaveButton = document.getElementById('settingsSaveButton')

        // Save the setting fields.
        detectionRefreshRate = document.getElementById('detectionRefreshRate')
        gameRefreshRate = document.getElementById('gameRefreshRate')
        runInBackground = document.getElementById('runInBackground')
        autoStart = document.getElementById('autoStart')

        detectionRefreshRate.innerHTML = ConfigManager.getDetectionRefreshRate()
        validateSettingsNumberField(detectionRefreshRate)
        gameRefreshRate.innerHTML = ConfigManager.getGameRefreshRate()
        validateSettingsNumberField(gameRefreshRate)
        runInBackground.checked = ConfigManager.getRunInBackground()
        autoStart.checked = ConfigManager.getAutoStart()

        // Bind Settings Number Field behavior.
        $('.settingsNumberField').keypress((e) => {
            const ex = [8, 38, 40]
            if(isNaN(String.fromCharCode(e.which)) && ex.indexOf(e.which) === -1) {
                e.preventDefault()
            }
        })
        $('.settingsNumberField').keydown((e) => {
            const ex = [38, 40]
            if(ex.indexOf(e.which) > -1){
                const val = parseInt(e.currentTarget.innerHTML)
                if(e.which === 38){
                    e.currentTarget.innerHTML = val + 1
                }
                if(e.which === 40){
                    e.currentTarget.innerHTML = val - 1
                }
                e.preventDefault()
            }
        })
        $('.settingsNumberField').keyup((e) => {
            validateSettingsNumberField(e.currentTarget)
        })

        settingsButton.addEventListener('click', () => {
            toggleSettingsView(true)
        })

        settingsSaveButton.addEventListener('click', () => {
            saveSettings()
        })

        settingsCancelButton.addEventListener('click', () => {
            toggleSettingsView(false)
        })

        // Begin first check after half a second.
        setTimeout(() => {startDiscordCheck()}, 500)

    }

}, false)

/*
 * Check if Discord is running.
 */

const discordInterval = 15
let discordTracker = 0
let discordTask = null

function startDiscordCheck(){
    loadText.innerHTML = 'App Starting'
    loadDetails.innerHTML = 'Checking for Discord..'
    ProcessManager.isRunning('discord.exe', 'discord', 'discord').then((v) => {

        if(v) {
            // Check for league config
            startLeagueCheck()

        } else {
            toggleSpinner(false)
            loadDetails.innerHTML = 'Discord must be running to use LeagueRPC.'
            checkDiscordTask()
            discordTask = setInterval(() => {
                checkDiscordTask()
            }, 1000)
        }
    })
}

function checkDiscordTask(){
    if(discordTracker === discordInterval){
        clearInterval(discordTask)
        discordTask = null
        discordTracker = 0
        toggleSpinner(true)
        startDiscordCheck()
    } else {
        const t = discordInterval - discordTracker;
        loadText.innerHTML = 'Rechecking in ' + t + ' second' + (t === 1 ? '' : 's') + '..'
        discordTracker += 1
    }
}

/*
 * Check for a valid League of Legends configuration.
 */

function startLeagueCheck(){

    loadText.innerHTML = 'App Starting'
    loadDetails.innerHTML = 'Retrieving League Account..'
    toggleSpinner(true)

    let acc = riot.getSavedAccount()


    if(acc != null){

        validateLeagueAccount()

    } else {

        toggleSpinner(false)
        clearRetryListeners()
        retryBtn.addEventListener('click', () => {
            startLeagueCheck()
        }, false)
        retryEnabled(true)

        loadText.innerHTML = 'Could not Retrieve League Account Data'
        loadDetails.innerHTML = 'Log into the League of Legends client, then click the above button to retry.'
    }

}

/*
 * Validate the information grabbed from the League config.
 */

const validateInterval = 30
let validateTracker = 0
let validateTask = null

function validateLeagueAccount() {

    loadText.innerHTML = 'App Starting'
    loadDetails.innerHTML = 'Validating League Account..'
    toggleSpinner(true)

    riot.getAccountData().then((v) => {

        if(v){

            prepareMainUI()

        } else {

            retryEnabled(false)
            toggleSpinner(false)
            clearRetryListeners()
            retryBtn.addEventListener('click', () => {
                validateLeagueAccount()
            }, false)

            loadText.innerHTML = 'Found Incorrect League Account Data'
            validateLeagueTask()
            validateTask = setInterval(() => {
                validateLeagueTask()
            }, 1000)
        }

    })
}

function validateLeagueTask() {
    if(validateTracker === validateInterval) {
        clearInterval(validateTask)
        validateTask = null
        validateTracker = 0
        retryEnabled(true)
        loadDetails.innerHTML = 'Log into the League of Legends client, then click the above button to retry.'
        loadDock.style.top = ''
    } else {
        const t = validateInterval - validateTracker;
        loadDetails.innerHTML = 'Log into the League of Legends client, then click the above button to retry.<br>You may retry in ' + t + ' second' + (t === 1 ? '' : 's') + '..' 
        loadDock.style.top = 'calc(-10% + 14px)'
        validateTracker += 1
    }
}

/*
 * All checks passed, show the main UI page.
 */

async function prepareMainUI(){

    loadText.innerHTML = 'App Starting'
    loadDetails.innerHTML = 'Finishing things up..'

    document.getElementById('summonerName').innerHTML = (await riot.getAccountData()).name
    document.getElementById('summonerIcon').src = await riot.getSummonerIcon()
    document.body.style.background = 'url(' + await riot.getRandomChampionSkinURL(await riot.getRecentChampId()) + ') no-repeat center center fixed'
    document.body.style.backgroundSize = 'cover'

    // TODO -> download img to temp folder and once dl is done show main content.
    setTimeout(() => {
        // Use jQuery to fade in the content.
        $('#loadContent').fadeOut(250, () => {
            $('#mainContent').fadeIn(250, () => {

            });
        });
    }, 2000)

}

/*
 * Settings View
 */



/*
 * Utility Functions
 */

 /**
  * Toggle the loading spinner.
  *
  * @param {boolean} on - If true, spinner is visible, otherwise retry icon is visible.
  */
function toggleSpinner(on) {
    loadSpinner.style.display = on ? '' : 'none'
    retryBtn.style.display = on ? 'none' : ''
}

/**
 * Enable/Disable the retry load button.
 * 
 * @param {boolean} v - If true, the retry button is clickable, otherwise it isnt. 
 */
function retryEnabled(v) {
    retryBtn.disabled = !v
}

/**
 * Enable/Disable the settings save button.
 * 
 * @param {boolean} v - If true, the settings save button is clickable, otherwise it isnt. 
 */
function settingsSaveEnabled(v) {
    settingsSaveButton.disabled = !v
}

/**
 * Clear all listeners from the retry load button.
 * This is done by cloning the button and updating
 * the global pointer.
 */
function clearRetryListeners() {
    const retryBtnClone = retryBtn.cloneNode(true)
    retryBtn.parentNode.replaceChild(retryBtnClone, retryBtn)
    retryBtn = retryBtnClone
}

/**
 * Display/hide the settings view.
 * 
 * @param {boolean} on - If true, the settings view will be displayed, otherwise it will be hidden.
 */
function toggleSettingsView(on) {
    if(on){
        summonerDock.style.height = 'calc(80% - 10%)'
        summonerDock.style.top = '10%'
        $('#summonerContent').fadeOut(250)
        setTimeout(() => {
            $('#settingsContent').fadeIn(250)
        }, 250)
    } else {
        $('#settingsContent').fadeOut(250, () => {
            $('#summonerContent').fadeIn(250)
            summonerDock.style.height = '154px'
            summonerDock.style.top = '20%'
        })
    }
}

function validateSettingsNumberField(currentTarget) {
    const val = parseInt(currentTarget.innerHTML)
    if(val > currentTarget.getAttribute('max') || val < currentTarget.getAttribute('min')){
        settingsSaveEnabled(false)
        currentTarget.parentElement.parentElement.classList.add('invalidSetting')
    } else {
        settingsSaveEnabled(true)
        currentTarget.parentElement.parentElement.classList.remove('invalidSetting')
    }
}

function saveSettings(){
    ConfigManager.setDetectionRefreshRate(parseInt(detectionRefreshRate.innerHTML))
    ConfigManager.setGameRefreshRate(parseInt(gameRefreshRate.innerHTML))
    ConfigManager.setRunInBackground(runInBackground.checked)
    ConfigManager.setAutoStart(autoStart.checked)
    ConfigManager.save()
}