const fs = require('fs');
const os = require('os')
const path = require('path')
const request = require('request')
const TeemoJS = require('teemojs');
const yaml = require('js-yaml')

const api = TeemoJS('RGAPI-6abbc074-973e-465f-8a2a-243fc29dd659');
const sysRoot = (os.platform() == "win32") ? process.cwd().split(path.sep)[0] : "/"
const riotConfig = path.join(sysRoot, 'Riot Games', 'League of Legends', 'Config', 'LeagueClientSettings.yaml')
const champCache = path.join(__dirname, '..', 'apicache', 'championdata.json')
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
        this.ddragonVersion = null
        this.champData = null
    }

    getDDragonVersion(cached = true){
        const self = this
        return new Promise((resolve, reject) => {
            if(self.ddragonVersion == null || !cached) {
                request.get('https://ddragon.leagueoflegends.com/api/versions.json', 
                {
                    json: true
                },
                function(error, response, body){
                    resolve((self.ddragonVersion = body[0]))
                })
            } else {
                resolve(self.ddragonVersion)
            }
        })
    }

    getSavedAccount(cached = true){
        try {
            if(this.savedAccount == null || !cached){
                const conf = yaml.safeLoad(fs.readFileSync(riotConfig, 'utf8'))
                this.savedAccount = {
                    accountId: conf.install['game-settings'].accountId,
                    region: regions[conf.install.globals['region']]
                }
            }
            return this.savedAccount
        } catch(err) {
            console.log('Unexpected error while retrieving saved data:', err)
            return null
        }
    }

    async getAccountData(cached = true){
        if(this.savedAccount == null){
            this.getSavedAccount()
        }
        if(this.accountData == null || !cached){
            this.accountData = await api.get(this.savedAccount.region, 'summoner.getByAccountId', this.savedAccount.accountId)
            if(this.accountData == null || this.accountData.id == null){
                this.accountData = null
            }
        }

        return this.accountData
    }

    async getRecentChampId(cached = true){
        if(this.recentChamp == null || !cached){
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
            this.recentChamp = freq.top
        }
        return this.recentChamp;
    }

    async getRandomChampionSkinURL(champion, cached = true){
        if(this.champData == null || !cached){
            // Rate limits too strong
            // this.champData = await api.get(this.savedAccount.region, 'lolStaticData.getChampionById', champion, {tags: 'skins'})
            const x = JSON.parse(fs.readFileSync(champCache, 'utf8'))
            this.champData = x.data[champion]
            this.champData.ddragonVersion = x.version
        }
        const sArr = this.champData.skins
        const rand = Math.floor(Math.random() * sArr.length)
        return 'http://ddragon.leagueoflegends.com/cdn/img/champion/splash/' + this.champData.key + '_' + sArr[rand].num + '.jpg'
    }

    async getSummonerIcon(cached = true){
        if(this.accountData == null || !cached){
            await this.getAccountData(cached)
        }
        if(this.ddragonVersion == null || !cached){
            await this.getDDragonVersion(cached)
        }
        return 'http://ddragon.leagueoflegends.com/cdn/' + this.ddragonVersion + '/img/profileicon/' + this.accountData.profileIconId + '.png'
    }

    

}

async function test() {
    /*const ddv = await RiotWrapper.getDDragonVersion()
    console.log(ddv)*/
    const wr = new RiotWrapper()
    const b = await wr.getAccountData()
    api.get(this.savedAccount.region, 'lolStaticData.getChampionById', champion, {tags: 'skins'})
    console.log(await wr.getRandomChampionSkinURL(131))
    /*console.log(b)
    console.log(await wr.getRecentChampId())
    console.log(wr.accountData, wr.savedAccount)*/
}

//test()

module.exports = RiotWrapper