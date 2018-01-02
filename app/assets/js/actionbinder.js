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

// Load View Elements.
let retryBtn, loadSpinner, loadText, loadDetails, loadDock

// Settings View Elements.
let settingsButton, summonerDock, settingsCancelButton, settingsSaveButton, settingStatusText

const settingsState = {
    modifiedBy: new Set(),
    invalid: new Set()
}

document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete'){
        
        // Reference the Load View Elements.
        retryBtn = document.getElementById('retryLoad')
        loadSpinner = document.getElementById('loadSpinner')
        loadText = document.getElementById('loadText')
        loadDetails = document.getElementById('loadDetails')
        loadDock = document.getElementById('loadDock')

        // Reference the Settings View Elements.
        settingsButton = document.getElementById('settingsButton')
        summonerDock = document.getElementById('summonerDock')
        settingsCancelButton = document.getElementById('settingsCancelButton')
        settingsSaveButton = document.getElementById('settingsSaveButton')
        settingStatusText = document.getElementById('settingStatusText')
        
        // Load each setting input with its saved value.
        bindSettingInputs()
        // Bind change listeners to each element.
        bindSettingsChangeListeners()
        // Ensure correct state is displayed.
        changeSettingsState(true)

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
                    validateSettingsNumberField(e.currentTarget)
                    settingsChangeEval(e.target.innerHTML != settingsState[e.target.id], e.currentTarget.id)
                }
                if(e.which === 40){
                    if(val-1 >= 0){
                        e.currentTarget.innerHTML = val - 1
                        validateSettingsNumberField(e.currentTarget)
                        settingsChangeEval(e.target.innerHTML != settingsState[e.target.id], e.currentTarget.id)
                    }
                }
                e.preventDefault()
            }
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

/*******************************************************************************
 *                                                                             *
 * Loading View Processing                                                     *
 *                                                                             *
 ******************************************************************************/

/*
 *  Check if Discord is running.
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

/*******************************************************************************
 *                                                                             *
 * Settings View Processing                                                    *
 *                                                                             *
 ******************************************************************************/

/**
 * Validate the input in a settings number field.
 * 
 * @param {Element} currentTarget - the element in question.
 */
function validateSettingsNumberField(currentTarget) {
    const val = parseInt(currentTarget.innerHTML)
    if(isNaN(val) || val > currentTarget.getAttribute('max') || val < currentTarget.getAttribute('min')){
        settingsSaveEnabled(false)
        currentTarget.parentElement.parentElement.classList.add('invalidSetting')
        settingsState.invalid.add(currentTarget.id)
    } else {
        if(currentTarget.parentElement.parentElement.classList.contains('invalidSetting')){
            currentTarget.parentElement.parentElement.classList.remove('invalidSetting')
            settingsState.invalid.delete(currentTarget.id)
            if(settingsState.modifiedBy.size > 0 && settingsState.invalid.size === 0){
                settingsSaveEnabled(true)
            }
        }
    }
}

/**
 * Update the state of the settings UI. This involves setting a status
 * message and enabling/disabling the save button based on the input.
 * 
 * @param {boolean} isSaved - if the settings values are already saved. 
 */
function changeSettingsState(isSaved){
    if(settingsState.invalid.size > 0){
        settingStatusText.innerHTML = 'Invalid Values!'
        settingsSaveEnabled(false)
    } else {
        if(isSaved){
            settingsSaveEnabled(false)
            settingStatusText.innerHTML = 'Saved'
        } else {
            settingsSaveEnabled(true)
            settingStatusText.innerHTML = 'Not Saved!'
        }
    }
}

/**
 * Load the currently saved settings values onto the UI.
 */
function bindSettingInputs(){
    const eles = document.getElementsByClassName('sinput')
    for(let i=0; i<eles.length; i++){
        const id = eles[i].id
        const gFn = ConfigManager['get' + id]
        if(typeof gFn === 'function'){
            settingsState[id] = gFn()
            if(eles[i].tagName === 'SPAN'){
                eles[i].innerHTML = gFn()
                if(eles[i].classList.contains('settingsNumberField')){
                    validateSettingsNumberField(eles[i])
                }
            } else if(eles[i].tagName === 'INPUT'){
                if(eles[i].getAttribute('type') === 'checkbox'){
                    eles[i].checked = gFn()
                }
            }
        } else {
            console.error('Malformed settings input:', id)
        }
    }
}

/**
 * Evaluate the actions which should be taken when a settings value
 * is modified.
 * 
 * @param {boolean} wasChanged - if the element was changed.
 * @param {string} id - the id of the element which was changed.
 */
function settingsChangeEval(wasChanged, id){
    if(wasChanged){
        settingsState.modifiedBy.add(id)
        changeSettingsState(settingsState.modifiedBy.size === 0)
    } else {
        settingsState.modifiedBy.delete(id)
        changeSettingsState(settingsState.modifiedBy.size === 0)
    }
}

/**
 * Binds change listeners to each registered settings inputs in order
 * to monitor changes and update the UI accordingly.
 */
function bindSettingsChangeListeners(){
    const eles = document.getElementsByClassName('sinput')
    for(let i=0; i<eles.length; i++){
        const id = eles[i].id
        if(eles[i].tagName === 'SPAN'){
            eles[i].addEventListener('input', (e) => {
                if(e.target.classList.contains('settingsNumberField')){
                    validateSettingsNumberField(e.currentTarget)
                }
                settingsChangeEval(e.target.innerHTML != settingsState[e.target.id], e.target.id)
            })
        } else if(eles[i].tagName === 'INPUT'){
            if(eles[i].getAttribute('type') === 'checkbox'){
                eles[i].addEventListener('change', (e) => {
                    settingsChangeEval(e.target.checked !== settingsState[e.target.id], e.target.id)
                })
            }
        }
    }
}

/**
 * Save the settings changes.
 */
function saveSettings(){
    changeSettingsState(true)
    settingsState.modifiedBy = new Set()
    settingsState.invalid = new Set()
    const eles = document.getElementsByClassName('sinput')
    for(let i=0; i<eles.length; i++){
        const id = eles[i].id
        const sFn = ConfigManager['set' + id]
        if(typeof sFn === 'function'){
            if(eles[i].tagName === 'SPAN'){
                sFn(eles[i].innerHTML)
            } else if(eles[i].tagName === 'INPUT'){
                if(eles[i].getAttribute('type') === 'checkbox'){
                    sFn(eles[i].checked)
                }
            }
        } else {
            console.error('Malformed settings input:', id)
        }
    }
    ConfigManager.save()
}

/*******************************************************************************
 *                                                                             *
 * Utility Functions                                                           *
 *                                                                             *
 ******************************************************************************/

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