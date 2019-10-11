const fs = require('fs');
const os = require('os')
const path = require('path')
const request = require('request')
const TeemoJS = require('teemojs');
const yaml = require('js-yaml')

const api = TeemoJS(process.env.RIOT_DEV_KEY)
const sysRoot = (os.platform() == "win32") ? process.cwd().split(path.sep)[0] : ( os.platform() == 'darwin' ? path.join('/', 'Applications') : '/')
const riotConfig = process.platform == 'win32' ? path.join(sysRoot, 'Riot Games', 'League of Legends', 'Config', 'LeagueClientSettings.yaml') : (process.platform == 'darwin' ? path.join(sysRoot, 'League of Legends.app', 'Contents', 'LoL', 'Config', 'LeagueClientSettings.yaml') : sysRoot)
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
// https://developer.riotgames.com/game-constants.html - gameQueueConfigId
const queues = {
    0: 'Custom Game',
    70: 'One for All', // Summoner's Rift (One for All)
    72: 'Snowdown Showdown (1v1)', // Howling Abyss (1v1 Snowdown Showdown)
    73: 'Snowdown Showdown (2v2)', // Howling Abyss (2v2 Snowdown Showdown)
    75: 'Hexakill', // Summoner's Rift (6v6 Hexakill)
    76: 'Ultra Rapid Fire', // Summoner's Rift (Ultra Rapid Fire)
    78: 'Mirrored One for All', // Summoner's Rift (Mirrored One for All)
    83: 'Ultra Rapid Fire (Co-op vs. AI)', // Summoner's Rift (Co-op vs. AI Ultra Rapid Fire)
    98: 'Hexakill', // Twisted Treeline (6v6 Hexakill)
    100: 'ARAM', // Butcher's Bridge (5v5 ARAM)
    310: 'Nemesis', // Summoner's Rift (Nemesis)
    313: 'Black Market Brawlers', // Summoner's Rift (Black Market Brawlers)
    317: 'Definitely Not Dominion', // Crystal Scar (Definitely Not Dominion)
    325: 'All Random', // Summoner's Rift (All Random)
    400: 'Draft Pick (Normal)', // Summoner's Rift (5v5 Draft Pick)
    420: 'Ranked Solo/Duo', // Summoner's Rift (5v5 Ranked Solo/Duo)
    430: 'Blind Pick (Normal)', // Summoner's Rift (5v5 Blind Pick)
    440: 'Ranked Flex', // Summoner's Rift (5v5 Ranked Flex)
    450: 'ARAM', // Howling Abyss (5v5 ARAM)
    460: 'Blind Pick (Normal)', // Twisted Treeline (3v3 Blind Pick)
    470: 'Ranked Flex', // Twisted Treeline (3v3 Ranked Flex)
    600: 'Hunt of the Blood Moon', // Summoner's Rift (Blood Hunt Assasin)
    610: 'Dark Star: Singularity', // Cosmic Ruins (Dark Star: Singularity)
    800: 'Co-op vs. AI (Intermediate)', // Twisted Treeline (Co-op vs. AI Intermediate)
    810: 'Co-op vs. AI (Intro)', // Twisted Treeline (Co-op vs. AI Intro)
    820: 'Co-op vs. AI (Beginner)', // Twisted Treeline (Co-op vs. AI Beginner)
    830: 'Co-op vs. AI (Intro)', // Summoner's Rift (Co-op vs. AI Intro)
    840: 'Co-op vs. AI (Beginner)', // Summoner's Rift (Co-op vs. AI Beginner)
    850: 'Co-op vs. AI (Intermediate)', // Summoner's Rift (Co-op vs. AI Intermediate)
    900: 'ARURF', // Summoner's Rift (ARURF)
    910: 'Ascension', // Crystal Scar (Ascension)
    920: 'Legend of the Poro King', // Howling Abyss (Legend of the Poro King)
    940: 'Nexus Siege', // Summoner's Rift (Nexus Siege)
    950: 'Doom Bots Voting', // Summoner's Rift (Doom Bots Voting)
    960: 'Doom Bots Standard', // Summoner's Rift (Doom Bots Standard)
    980: 'Invasion: Normal', // Valoran City Park (Star Guardian Invasion: Normal)
    990: 'Invasion: Onslaught', // Valoran City Park (Star Guardian Invasion: Onslaught)
    1000: 'Overcharge', // Overcharge (PROJECT: Hunters)
    1010: 'Snow ARURF' // Summoner's Rift (Snow ARURF)
}

const maps = {
    1: 'Summoner\'s Rift',
    2: 'Summoner\'s Rift',
    3: 'The Proving Grounds',
    4: 'Twisted Treeline',
    8: 'The Crystal Scar',
    10: 'Twisted Treeline',
    11: 'Summoner\'s Rift',
    12: 'Howling Abyss',
    14: 'Butcher\'s Bridge',
    16: 'Cosmic Ruins',
    18: 'Valoran City Park',
    19: 'Substructure 43'
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

    // V4 broke this, we can no longer simply use the account id.
    // For whatever reason, there is now an "encrypted" account id
    // which must be used through the API. The account id is still
    // exposed in the client configuration, so riot's not even
    // using this in the client. A fix would have to prompt the user
    // to provide their summoner name in the settings. Seeing as this
    // project is discontinued, that likely won't happen.
    async getSavedAccount(cached = true){
        try {
            if(this.savedAccount == null || !cached){
                if(process.env.SUMMONER_NAME != null && process.env.SUMMONER_REGION != null) {
                    const accountData = await api.get(process.env.SUMMONER_REGION, 'summoner.getBySummonerName', process.env.SUMMONER_NAME)
                    this.savedAccount = {
                        accountId: accountData.accountId,
                        region: process.env.SUMMONER_REGION
                    }
                } else {
                    const conf = yaml.safeLoad(fs.readFileSync(riotConfig, 'utf8'))
                    this.savedAccount = {
                        accountId: conf.install['game-settings'].accountId,
                        region: regions[conf.install.globals['region']]
                    }
                }
            }
            return this.savedAccount
        } catch(err) {
            console.log('Unexpected error while retrieving saved data:', err)
            return null
        }
    }

    isInProgress(){
        try {
            const conf = yaml.safeLoad(fs.readFileSync(riotConfig, 'utf8'))
            // conf.install['gameflow-process-info'].pid is available
            return conf.install['gameflow-process-info'] != null
        } catch(err) {
            console.log('Unexpected error while retrieving saved data:', err)
            return false
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
            const matchData = await api.get(this.savedAccount.region, 'match.getMatchlist', this.savedAccount.accountId)
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

    async getCurrentGameInfo(){
        const cGame = await api.get(this.savedAccount.region, 'spectator.getCurrentGameInfoBySummoner', this.accountData.id.toString())
        if(cGame == null){
            return null
        }
        console.log(cGame)
        const ret = {
            queueType: cGame.gameType === 'TUTORIAL_GAME' ? 'Tutorial' : (cGame.gameType === 'CUSTOM_GAME' ? 'Custom Game' : queues[cGame.gameQueueConfigId]),
            mapName: maps[cGame.mapId],
            startTime: cGame.gameStartTime,
            spectateKey: cGame.observers.encryptionKey,
            gameId: cGame.gameId
        }
        if(ret.queueType == null){
            ret.queueType = cGame.gameMode
        }
        if(ret.mapName == null){
            ret.mapName = 'Unknown Map'
        }
        for(let i=0; i<cGame.participants.length; i++){
            const p = cGame.participants[i]
            if(p.summonerName === this.accountData.name){
                const x = JSON.parse(fs.readFileSync(champCache, 'utf8'))
                ret.champion = {
                    id: p.championId,
                    name: x.data[p.championId].name
                }
                break
            }
        }
        return ret
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