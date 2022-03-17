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
    bossSpawnTime;
    bossKilledTime;

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
    matchDataChanged;


    // Events
    playerJoinEventHandler;
    playerLeftEventHandler;
    newGameStartingEventHandler;
    newWaveStartingEventHandler;
    traderTimeStartingEventHandler;
    bossWaveStartingEventHandler;
    bossKilledEventHandler;

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
        this.matchDataChanged = false;
        this.bossData = { spawned: false, killed: false };
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
    getTotalWave() {
        return this.totalWave - 1;
    }
    getNextWave() {
        if (this.currentWave + 1 == this.totalWave)
            return "Boss Wave";
        else if (this.currentWave + 1 == this.totalWave - 1)
            return "Final Wave";
        else
            return this.currentWave + 1;
    }
    isWaveInProgress() {
        return this.currentWave > 0 && !this.traderActive && !this.matchEnded;
    }
    isTraderOpen() {
        return this.currentWave > 0 && this.traderActive && !this.matchEnded;
    }
    isMatchEnded() {
        return this.matchEnded;
    }
    isBossSpawned() {
        return this.bossData.spawned;
    }
    isBossDead() {
        return this.bossData.spawned && this.bossData.health <= 0;
    }
    getBossHealth() {
        return this.bossData.health > 0 ? this.bossData.health : 0;
    }
    getBossKiller() {
        for (let player of this.playerList) {
            if (player.matchStats.killedBoss)
                return player;
        }
        return null;
    }

    setMatchData(matchData) {
        // Detect wave starting
        if (matchData.currentWave > this.currentWave && matchData.waveIsActive) {
            this.traderActive = false;
            this.matchDataChanged = true;
            // Detect New Game Starting
            if (matchData.currentWave == 1) {
                logger.log('KF2', `New Game Starting: ${matchData.currentWave}`);
                this.startedTime = moment();
                if (this.newGameStartingEventHandler)
                    this.newGameStartingEventHandler(matchData);
            }
            if (matchData.currentWave < this.totalWave) {
                logger.log('KF2', `New Wave Starting: ${matchData.currentWave}`);
                    if (this.newWaveStartingEventHandler)
                        this.newWaveStartingEventHandler(matchData);
            }
            else {
                logger.log('KF2', `Boss Wave Starting`);
                if (this.bossWaveStartingEventHandler)
                    this.bossWaveStartingEventHandler(matchData);
            }

            this.waveStartTime = moment();
        }

        if (matchData.bossData) {
            this.bossData.health = matchData.bossData.health;
            this.bossData.maxHealth = matchData.bossData.maxHealth;
            this.bossData.name = matchData.bossData.name;
            this.bossData.className = matchData.bossData.className;

            if (this.bossData.maxHealth > 0 && !this.bossData.spawned) {
                this.bossData.spawned = true;
                this.matchDataChanged = true;
                this.bossSpawnTime = moment();
                logger.log('KF2', `Boss ${this.bossData.name} Spawned`);
            }
            if (this.bossData.spawned && this.bossData.health <= 0 && !this.bossData.killed) {
                this.bossKilledTime = moment();
                this.matchDataChanged = true;
                this.bossData.killed = true
                if (this.bossKilledEventHandler)
                    this.bossKilledEventHandler(this.bossData);

                logger.log('KF2', `Boss ${this.bossData.name} killed`);
            }
        }

        // Detect Trader time
        if (this.currentWave > 0 && !matchData.waveIsActive && !this.traderActive) {
            logger.log('KF2', `Trader Time Starting`);
            this.traderActive = true;
            this.waveEndTime = moment();
            if (this.traderTimeStartingEventHandler)
                this.traderTimeStartingEventHandler(matchData);
        }

        // Detect End of match
        if (this.currentWave > 0 && !matchData.waveStarted && matchData.waveIsActive && !this.matchEnded) {
            logger.log('KF2', `Match Ended`);
            this.matchDataChanged = true;
            this.matchEnded = true;
            this.endedTime = moment();
            if (this.matchEndedEventHandler)
                this.matchEndedEventHandler(matchData)
        }
        if (this.traderActive && !matchData.waveStarted && !matchData.waveIsActive && !this.matchEnded && matchData.playerList.length == 0) {
            logger.log('KF2', `Match Ended at Trader Time`);
            this.matchDataChanged = true;
            this.matchEnded = true;
            this.endedTime = moment();
            if (this.matchEndedEventHandler)
                this.matchEndedEventHandler(matchData)
        }

        this.aiRemaining = matchData.aiRemaining;
        this.aiTotal = matchData.aiTotal;
        this.mapName = matchData.mapName;
        this.gameDifficulty = matchData.gameDifficulty;
        this.gameLength = matchData.gameLength;
        this.totalWave = matchData.totalWave;
        this.waveStarted = matchData.waveStarted;
        this.waveIsActive = matchData.waveIsActive;
        this.currentWave = matchData.currentWave;
        this.traderIsOpen = matchData.traderIsOpen;

        //this.copyPlayerData(matchData.playerList)
    }

    copyPlayerData(newPList) {
        if (Array.isArray(newPList)) {
            for (let newPlayer of newPList) {
                let player = this.getPlayerBySteamId(newPlayer.steamId);
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
            if (player.steamId == sid)
                return player;
        }
        return null;
    }

    checkPlayerDataChanged(kf2PlayerList) {
        // Check for changes or new players joining the match
        for (let kf2Player of kf2PlayerList) {
            kf2Player.left = false;
            let matchPlayer = this.getPlayerBySteamId(kf2Player.steamId)
            if (matchPlayer == null) {
                kf2Player.changed = true;
                this.matchDataChanged = true;
                this.forceUpdatePlayerEmbeds = true;
                kf2Player.getWeaponStats = weaponClass => {
                    return this.getWeaponStats(kf2Player, weaponClass);
                }
                this.playerList.push(kf2Player);
                logger.log('KF2', `Player Joined: ${kf2Player.playerName} steamId: ${kf2Player.steamId}`);
                if (this.playerJoinEventHandler) {
                    this.playerJoinEventHandler(kf2Player);
                }
            }
            else {
                if (JSON.stringify(matchPlayer, this.stringifyIgnore) != JSON.stringify(kf2Player, this.stringifyIgnore)) {
                    if (matchPlayer.left) {
                        matchPlayer.left = false;
                        this.matchDataChanged = true;
                        logger.log('KF2', `Player Joined Back: ${kf2Player.playerName} steamId: ${kf2Player.steamId}`);
                        if (this.playerJoinEventHandler) {
                            this.playerJoinEventHandler(kf2Player);
                        }
                    }
                    matchPlayer.changed = true;
                    if (matchPlayer.ready != kf2Player.ready)
                        this.matchDataChanged = true;

                    this.copyProperties(matchPlayer, kf2Player);
                }
            }
        }

        // Check for players leaving the match
        for (let matchPlayer of this.playerList.filter(p => !p.left)) {
            let playerLeft = true;
            for (let kf2Player of kf2PlayerList) {
                if (kf2Player.steamId == matchPlayer.steamId) {
                    playerLeft = false;
                    break;
                }
            }
            matchPlayer.left = playerLeft;
            if (playerLeft) {
                logger.log('KF2', `Player Left: ${matchPlayer.playerName}`);
                matchPlayer.leftTime = moment();
                this.matchDataChanged = true;
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
        if ((this.currentWave != newMatchData.currentWave)
            || (this.waveStarted != newMatchData.waveStarted)
            || (this.waveIsActive != newMatchData.waveIsActive)
            || (this.aiRemaining != newMatchData.aiRemaining)
            || (this.bossData.spawned && this.bossData.health != newMatchData.bossData.health)) {
            this.matchDataChanged = true;
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