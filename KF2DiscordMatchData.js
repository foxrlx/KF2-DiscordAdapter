const logger = require('./Logging');
const helper = require('./DiscordHelper');
const moment = require('moment');

class KF2DiscordMatchData {
    mapName;
    gameDifficulty;
    gameLength;
    totalWave;
    waveStarted;
    waveIsActive;
    aiRemaining;
    aiTotal;
    bossData;

    createdTime;
    startedTime;
    endedTime;

    waveStartTime;
    waveEndTime;

    currentWave;

    playerList;
    matchSessionId;

    playerMsgObjArray;
    matchDataMsgObj;

    // Flags
    forceUpdateLobbyEmbed;
    newMatchAnnounced;
    traderActive;
    matchEnded;


    // Events
    playerJoinEventHandler;
    playerLeftEventHandler;
    newGameStartingEventHandler;
    newWaveStartingEventHandler;
    traderTimeStartingEventHandler;
    bossWaveStartingEventHandler;

    constructor(sessionid) {
        this.matchSessionId = sessionid;
        this.createdTime = moment();
        this.startedTime = null;
        this.endedTime = null;

        this.playerList = [];
        this.playerMsgObjArray = [];
        this.newMatchAnnounced = false;
        this.forceUpdateLobbyEmbed = false;
        this.traderActive = false;
        this.matchEnded = false;
        this.currentWave = 0;
    }
    setMatchAnnounced() {
        this.newMatchAnnounced = true;
    }
    checkMatchAnnounced() {
        return this.newMatchAnnounced;
    }
    getCurrentWave() {
        return this.currentWave - this.currentWave > 0 ? 1 : 0;
    }
    isBossWave() {
        return this.currentWave == this.totalWave;
    }

    setMatchData(matchData) {
        console.log(matchData.playerlist);

        // Detect wave starting
        if (matchData.currentwave > this.currentWave && matchData.waveisactive) {
            this.traderActive = false;

            // Detect New Game Starting
            if (matchData.currentWave == 1) {
                logger.log('KF2', `New Game Starting: ${matchData.currentwave}`);
                this.startedTime = moment();
                if (this.newGameStartingEventHandler)
                    this.newGameStartingEventHandler(matchData);
            }
            logger.log('KF2', `New Wave Starting: ${matchData.currentwave}`);
            if (this.newWaveStartingEventHandler)
                this.newWaveStartingEventHandler(matchData);

            this.waveStartTime = moment();
        }

        // Detect Trader time
        if (this.currentWave > 0 && !matchData.waveisactive && !this.traderActive) {
            logger.log('KF2', `Trader Time Starting`);
            this.traderActive = true;
            this.waveEndTime = moment();
            if (this.traderTimeStartingEventHandler)
                this.traderTimeStartingEventHandler(matchData);
        }

        // Detect End of match
        if (this.currentWave > 0 && !matchData.wavestarted && matchData.waveisactive && !this.matchEnded) {
            logger.log('KF2', `Match Ended`);
            this.matchEnded = true;
            this.endedTime = moment();
            if (this.matchEndedEventHandler)
                this.matchEndedEventHandler(matchData)
        }
        if (this.traderActive && !matchData.wavestarted && !matchData.waveisactive && !this.matchEnded && matchData.playerlist.length == 0) {
            logger.log('KF2', `Match Ended at Trader Time`);
            this.matchEnded = true;
            this.endedTime = moment();
            if (this.matchEndedEventHandler)
                this.matchEndedEventHandler(matchData)
        }

        this.aiRemaining = matchData.airemaining;
        this.aiTotal = matchData.aitotal;
        this.mapName = matchData.mapname;
        this.gameDifficulty = matchData.gamedifficulty;
        this.gameLength = matchData.gamelength;
        this.totalWave = matchData.totalwave;
        this.waveStarted = matchData.wavestarted;
        this.waveIsActive = matchData.waveisactive;
        this.currentWave = matchData.currentwave;

        if (matchData.bossData) {
            this.bossData.health = matchData.bossData.health;
            this.bossData.maxHealth = matchData.bossData.maxHealth;
            this.bossData.name = matchData.bossData.name;
            this.bossData.className = matchData.bossData.className;
        }


        //this.copyPlayerData(matchData.playerlist)
    }

    copyPlayerData(newPList) {
        if (Array.isArray(newPList)) {
            for (let newPlayer of newPList) {
                let player = this.getPlayerBySteamId(newPlayer.steamid);
                if (player == null) {
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
        for (var prop in obj1) {
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
                kf2Player.getWeaponStats = weaponClass => {
                    return this.getWeaponStats(kf2Player, weaponClass);
                }
                this.playerList.push(kf2Player);
                logger.log('KF2', `Player Joined: ${kf2Player.playername} steamid: ${kf2Player.steamid}`);
                if (this.playerJoinEventHandler) {
                    this.playerJoinEventHandler(kf2player);
                }
            }
            else {
                if (JSON.stringify(matchPlayer, this.stringifyIgnore) != JSON.stringify(kf2Player, this.stringifyIgnore)) {
                    if (matchPlayer.left) {
                        matchPlayer.left = false;
                        logger.log('KF2', `Player Joined Back: ${kf2Player.playername} steamid: ${kf2Player.steamid}`);
                        if (this.playerJoinEventHandler) {
                            this.playerJoinEventHandler(kf2player);
                        }
                    }
                    matchPlayer.changed = true;
                    this.copyProperties(matchPlayer, kf2Player);
                }
            }
        }

        // Check for players leaving the match
        for (let matchPlayer of this.playerList.filter(p => !p.left)) {
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
                matchPlayer.leftTime = moment();
                // If a player leaves at wave 0 (Lobby) we remove it from playerList collection
                if (this.currentWave == 0 && this.playerList.indexOf(matchPlayer) >= 0) {
                    this.playerList.splice(this.playerList.indexOf(matchPlayer), 1);
                }
                matchPlayer.changed = true;
                this.forceUpdateLobbyEmbed = true;
                if (this.playerLeftEventHandler) {
                    this.playerLeftEventHandler(matchPlayer);
                }
            }
        }


        //console.log(JSON.stringify(this.PlayerList));
        //console.log(JSON.stringify(players));
        // if (JSON.stringify(this.PlayerList, this.StringifyIgnore) != JSON.stringify(players, this.StringifyIgnore))
        //     return true;
        // return false;
    }

    getWeaponStats(player, weaponClass) {
        if (!Array.isArray(player.weaponDamage))
            return;

        for (let item of player.weaponDamage) {
            if (item.itemClassName == weaponClass) {
                return item;
            }
        }
    }

    checkMatchDataChanged(newMatchData) {
        if ((this.currentWave != newMatchData.currentwave)
            || (this.waveStarted != newMatchData.wavestarted)
            || (this.waveIsActive != newMatchData.waveisactive)
            || (this.aiRemaining != newMatchData.airemaining)) {
            this.forceUpdateLobbyEmbed = true;
        }
    }

    stringifyIgnore(key, value) {
        if (key == "steamData") return undefined;
        else if (key == "changed") return undefined;
        else if (key == "ping") return undefined;
        else if (key == "leftTime") return undefined;
        else if (key == "getWeaponStats") return undefined;
        else return value;
    }
}

module.exports = KF2DiscordMatchData;