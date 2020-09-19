const logger = require('./Logging');

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
        //this.copyPlayerData(matchData.playerlist)
    }

    copyPlayerData(newPList) {
        if (Array.isArray(newPList)) {
            for (let newPlayer of newPList) {
                let player = this.getPlayerBySteamId(newPlayer.steamid);
                if (player == null){
                    newPlayer.changed = true;
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
        for (let playerMsgObj of this.playerMsgObjArray) {
            let playerMsgObjId = `${this.matchSessionId}_${id}`
            if (playerMsgObj.id == playerMsgObjId)
                return playerMsgObj;
        }
        return null;
    }
    getPlayerById(id) {
        for (let player of this.playerList) {
            if (player.id == id) {
                return player
            }
        }
        return null;
    }
    getPlayerBySteamId(sid) {
        for (let player of this.playerList) {
            if (player.steamid == sid)
                return player;
        }
        return null;
    }

    checkPlayerDataChanged(kf2PlayerList) {
        // Check for changes or new players joining the match
        for (let kf2Player of kf2PlayerList) {
            kf2Player.left = false;
            let matchPlayer = this.getPlayerBySteamId(kf2Player.steamid)
            if (matchPlayer == null) {
                kf2Player.changed = true;
                this.forceUpdatePlayerEmbeds = true;
                this.playerList.push(kf2Player);
                logger.log('KF2', `Player Joined: ${kf2Player.playername}`);
            }
            else {
                if (JSON.stringify(matchPlayer, this.stringifyIgnore) != JSON.stringify(kf2Player, this.stringifyIgnore)) {
                    matchPlayer.changed = true;
                    this.copyProperties(matchPlayer, kf2Player);
                }
            }
        }

        // Check for players leaving the match
        for (let matchPlayer of this.playerList) {
            if (matchPlayer.left)
                continue;

            let playerLeft = true;
            for (let kf2Player of kf2PlayerList) {
                if (kf2Player.steamid == matchPlayer.steamid) {
                    playerLeft = false;
                    break;
                }
            }
            matchPlayer.left = playerLeft;
            if (playerLeft) {
                logger.log('KF2', `Player Left: ${matchPlayer.playername}`);
                if (this.currentWave == 0) {
                    
                }
                matchPlayer.changed = true;
                this.forceUpdateLobbyEmbed = true;
            }
        }


        //console.log(JSON.stringify(this.PlayerList));
        //console.log(JSON.stringify(players));
        // if (JSON.stringify(this.PlayerList, this.StringifyIgnore) != JSON.stringify(players, this.StringifyIgnore))
        //     return true;
        // return false;
    }

    checkMatchDataChanged(newMatchData) {
        if ((this.currentWave != newMatchData.currentwave)
        || (this.waveStarted != newMatchData.wavestarted)
        || (this.waveIsActive != newMatchData.waveisactive)) {
            this.forceUpdateLobbyEmbed = true;
        }
    }

    stringifyIgnore(key, value)
    {
        if (key=="steamData") return undefined;
        else if (key == "changed") return undefined;
        else if (key == "ping") return undefined;
        else return value;
    }
}

module.exports = KF2DiscordMatchData;