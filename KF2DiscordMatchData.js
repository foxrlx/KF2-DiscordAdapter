const { builtinModules } = require("module");
const { Console } = require("console");
const { isUndefined } = require("util");

class KF2DiscordMatchData {
    MatchData;
    PlayerList;
    MatchSessionId;
    CreatedOn;
    CurrentWave;
    ForceUpdateLobbyEmbed;

    PlayerMsgObjArray;
    MatchDataMsgObj;

    // Flags
    NewMatchAnnounced;

    constructor (sessionid, createdon) {
        this.MatchSessionId = sessionid;
        this.CreatedOn = createdon;

        this.MatchData = {};
        this.PlayerList = [];
        this.PlayerMsgObjArray = [];
        this.NewMatchAnnounced = false;
        this.ForceUpdateLobbyEmbed = false;
        this.CurrentWave = 0;
    }
    
    SetMatchAnnounced() {
        this.NewMatchAnnounced = true;
    }
    CheckMatchAnnounced() {
        return this.NewMatchAnnounced;
    }

    SetMatchData(matchData) {
        this.MatchData.mapname = matchData.mapname;
        this.MatchData.gamedifficulty = matchData.gamedifficulty;
        this.MatchData.gamelength = matchData.gamelength;
        this.MatchData.totalwave = matchData.totalwave;
        this.MatchData.wavestarted = matchData.wavestarted;
        this.MatchData.waveisactive = matchData.waveisactive;
        
        this.CurrentWave = matchData.currentwave;
        this.CopyPlayerData(matchData.playerlist)
    }
    CopyPlayerData(newPList) {
        if (Array.isArray(newPList)) {
            for (let newPlayer of newPList) {
                let player = this.GetPlayerById(newPlayer.id);
                if (player == null){
                    newPlayer.Changed = true;
                    this.ForceUpdatePlayerEmbeds = true;
                    this.PlayerList.push(newPlayer);
                }
                else {
                    this.CopyProperties(player, newPlayer);
                }
            }
        }
    }

    CopyProperties(obj1, obj2) {
        for (var prop in obj1)
        {
            if (Object.prototype.hasOwnProperty.call(obj1, prop)) {
                if (obj2[prop] != null)
                    obj1[prop] = obj2[prop];
            }
        }
    }

    GetPlayerMsgObject(id) {
        for (let playerMsgObj of this.PlayerMsgObjArray) {
            let playerMsgObjId = `${this.MatchSessionId}_${id}`
            if (playerMsgObj.id == playerMsgObjId)
                return playerMsgObj;
        }
        return null;
    }
    GetPlayerById(id) {
        for (let player of this.PlayerList) {
            if (player.id == id) {
                return player
            }
        }
        return null;
    }

    CheckPlayerDataChanged(players) {
        for (let player of players) {
            let matchPlayer = this.GetPlayerById(player.id)
            if (matchPlayer != null) {
                if (JSON.stringify(matchPlayer, this.StringifyIgnore) != JSON.stringify(player, this.StringifyIgnore)) {
                    matchPlayer.Changed = true;
                    this.CopyProperties(matchPlayer, player);
                }
            }
        }
        //console.log(JSON.stringify(this.PlayerList));
        //console.log(JSON.stringify(players));
        // if (JSON.stringify(this.PlayerList, this.StringifyIgnore) != JSON.stringify(players, this.StringifyIgnore))
        //     return true;
        // return false;
    }

    CheckMatchDataChanged(newMatchData) {
        if ((this.MatchData.CurrentWave != newMatchData.CurrentWave) ||
            (this.MatchData.wavestarted != newMatchData.wavestarted) ||
            (this.MatchData.waveisactive != newMatchData.waveisactive)) {
                this.ForceUpdateLobbyEmbed = true;
            }

    }

    StringifyIgnore(key, value)
    {
        if (key=="SteamData") return undefined;
        else if (key == "Changed") return undefined;
        else if (key == "ping") return undefined;
        else return value;
    }
}

module.exports = KF2DiscordMatchData;