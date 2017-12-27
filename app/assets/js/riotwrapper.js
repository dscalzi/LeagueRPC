const fs = require('fs');
const os = require('os')
const path = require('path')
const request = require('request')
const TeemoJS = require('teemojs');
const yaml = require('js-yaml')

const api = TeemoJS('RGAPI-dc7da2d4-bfc2-454d-96e3-d12dbcaa259c');
const sysRoot = (os.platform() == "win32") ? process.cwd().split(path.sep)[0] : "/"
const riotConfig = path.join(sysRoot, 'Riot Games', 'League of Legends', 'Config', 'LeagueClientSettings.yaml')
const regions = {
    BR: 'BR1',
    EUNE: 'EUN1',
    EUW: 'EUW1',
    JP: 'JP1',
    KR: 'KR',
    LA1: 'LA1',
    LA2: 'LA2',
    NA: 'NA1',
    OC1: 'OC1',
    RU: 'RU',
    TR: 'TR1'
}

class RiotWrapper {

    constructor(){
        this.savedAccount = null
        this.accountData = null
        this.recentChamp = null
        this.ready = false
    }

    static async getDDragonVersion(){
        return new Promise(function(resolve, reject){
            request.get('https://ddragon.leagueoflegends.com/api/versions.json', 
            {
                json: true
            },
            function(error, response, body){
                resolve(body[0])
            })
        })
    }

    loadSavedData(){
        try {
            const conf = yaml.safeLoad(fs.readFileSync(riotConfig, 'utf8'))
            this.savedAccount = {
                accountId: conf.install['game-settings'].accountId,
                region: regions[conf.install.globals['region']]
            }
        } catch(err) {
            console.log('Unexpected error while retrieving saved data:', err)
        }
    }

    async validateAndLoad(){
        if(this.savedAccount == null){
            this.loadSavedData()
        }
        this.accountData = await api.get(this.savedAccount.region, 'summoner.getByAccountId', this.savedAccount.accountId)
        return (this.ready = this.accountData != null)
    }

    isReady(){
        return this.ready
    }

    async getRecentChampId(){
        const matchData = await api.get(this.savedAccount.region, 'match.getRecentMatchlist', this.savedAccount.accountId)
        const mArr = matchData.matches
        const freq = {top: null}
        for(let i=0; i<mArr.length; i++){
            if(i == 0){
                freq.top = mArr[i].champion
            }
            if(freq[mArr[i].champion] == null){
                freq[mArr[i].champion] = 1
            } else {
                const amt = freq[mArr[i].champion] + 1
                freq[mArr[i].champion] = amt
                if(freq.top != mArr[i].champion && freq[freq.top] < amt){
                    freq.top = mArr[i].champion
                }
            }
        }
        return (this.recentChamp = freq.top);
    }

    async getRandomChampionSkinURL(champion){
        const champData = await api.get(this.savedAccount.region, 'lolStaticData.getChampionById', champion, {tags: 'skins'})
        const sArr = champData.skins
        const rand = Math.floor(Math.random() * 4)
        return 'http://ddragon.leagueoflegends.com/cdn/img/champion/splash/' + champData.key + '_' + sArr[rand].num + '.jpg'
    }

}

async function test() {
    /*const ddv = await RiotWrapper.getDDragonVersion()
    console.log(ddv)*/
    const wr = new RiotWrapper()
    const b = await wr.validateAndLoad()
    console.log(await wr.getRandomChampionSkinURL(131))
    /*console.log(b)
    console.log(await wr.getRecentChampId())
    console.log(wr.accountData, wr.savedAccount)*/
}

test()