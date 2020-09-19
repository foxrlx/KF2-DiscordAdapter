class KF2DiscordMatchData {
    mapName;
    gameDifficulty;
    gameLength;
    totalWave;
    waveStarted;
    waveIsActive;

    createdOn;
    currentWave;

    playerList;
    matchSessionId;

    playerMsgObjArray;
    matchDataMsgObj;

    // Flags
    forceUpdateLobbyEmbed;
    newMatchAnnounced;

    constructor (sessionid, createdon) {
        this.matchSessionId = sessionid;
        this.createdOn = createdon;

        this.playerList = [];
        this.playerMsgObjArray = [];
        this.newMatchAnnounced = false;
        this.forceUpdateLobbyEmbed = false;
        this.currentWave = 0;
    }
    setMatchAnnounced() {
        this.newMatchAnnounced = true;
    }
    checkMatchAnnounced() {
        return this.newMatchAnnounced;
    }

    setMatchData(matchData) {
        this.mapName = matchData.mapname;
        this.gameDifficulty = matchData.gamedifficulty;
        this.gameLength = matchData.gamelength;
        this.totalWave = matchData.totalwave;
        this.waveStarted = matchData.wavestarted;
        this.waveIsActive = matchData.waveisactive;
        
        this.currentWave = matchData.currentwave;
        this.copyPlayerData(matchData.playerlist)
    }
    copyPlayerData(newPList) {
        if (Array.isArray(newPList)) {
            for (let newPlayer of newPList) {
                let player = this.getPlayerById(newPlayer.id);
                if (player == null){
                    newPlayer.Changed = true;
                    this.forceUpdatePlayerEmbeds = true;
                    this.playerList.push(newPlayer);
                }
                else {
                    this.copyProperties(player, newPlayer);
                }
            }
        }
    }

    copyProperties(obj1, obj2) {
        for (var prop in obj1)
        {
            if (Object.prototype.hasOwnProperty.call(obj1, prop)) {
                if (obj2[prop] != null)
                    obj1[prop] = obj2[prop];
            }
        }
    }

    getPlayerMsgObject(id) {
        for (let playerMsgObj of this.PlayerMsgObjArray) {
            let playerMsgObjId = `${this.MatchSessionId}_${id}`
            if (playerMsgObj.id == playerMsgObjId)
                return playerMsgObj;
        }
        return null;
    }
    getPlayerById(id) {
        for (let player of this.PlayerList) {
            if (player.id == id) {
                return player
            }
        }
        return null;
    }

    checkPlayerDataChanged(players) {
        for (let player of players) {
            let matchPlayer = this.getPlayerById(player.id)
            if (matchPlayer != null) {
                if (JSON.stringify(matchPlayer, this.stringifyIgnore) != JSON.stringify(player, this.stringifyIgnore)) {
                    matchPlayer.Changed = true;
                    this.copyProperties(matchPlayer, player);
                }
            }
        }
        //console.log(JSON.stringify(this.PlayerList));
        //console.log(JSON.stringify(players));
        // if (JSON.stringify(this.PlayerList, this.StringifyIgnore) != JSON.stringify(players, this.StringifyIgnore))
        //     return true;
        // return false;
    }

    checkMatchDataChanged(newMatchData) {
        if ((this.currentWave != newMatchData.currentwave) ||
            (this.waveStarted != newMatchData.wavestarted) ||
            (this.waveIsActive != newMatchData.waveisactive)) {
                this.forceUpdateLobbyEmbed = true;
            }

    }

    stringifyIgnore(key, value)
    {
        if (key=="SteamData") return undefined;
        else if (key == "Changed") return undefined;
        else if (key == "ping") return undefined;
        else return value;
    }
}

module.exports = KF2DiscordMatchData;