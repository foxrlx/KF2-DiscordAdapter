const config = require('config');
const logger = require('./Logging');
const helper = require('./DiscordHelper');
const steamHelper = require('./SteamHelper');
const discordGateway = require('./DiscordGateway');
const kf2Listener = require('./KF2Listener');
const matchData = require('./KF2DiscordMatchData');

let currentMatchSession;
let lastPlayerEmbedSent;
let checkEmbedsInterval;
let steam;
(async () => {
    let token = config.get("Discord.Token");
    let channelId = config.get("Discord.ChannelId")
    let steamToken = config.get("Steam.Token");
    
    steam = new steamHelper(steamToken);
    let discord = new discordGateway(token, channelId);

    lastPlayerEmbedSent = new Date();
    checkEmbedsInterval = setInterval(checkPlayerEmbedsTimer, 500);

    discord.DiscordReadyHandler = () => {
        logger.log("Discord", 'Logged In');
    }
    discord.DiscordMessageHandler = msg => {
        logger.log("Discord", `${msg.author.username}: ${msg.content}`);
    }
    discord.Login();

    let kf2listener = new kf2Listener(7070);

    kf2listener.kf2MessageEventHandler = content => {
        let steamid = helper.h2d(content.steamid);
        steam.getPlayerSummaries(steamid).then(data => {
            let steamData = JSON.parse(data);
            let embed = helper.createMessageEmbed(content, steamData);
            discord.SendMsg(embed);
        });
    }

    kf2listener.kf2MatchCreatedEventHandler = content => {
        currentMatchSession = new matchData(content.matchsession, helper.getDateTime());
    }

    kf2listener.kf2MatchLobbyDataEventHandler = async content => {
        if (content.matchsession != currentMatchSession.matchSessionId)
            return;

        if (!Array.isArray(content.playerlist))
            content.playerlist = [];

        currentMatchSession.checkPlayerDataChanged(content.playerlist);
        currentMatchSession.checkMatchDataChanged(content);
        currentMatchSession.setMatchData(content);
    }
    function checkPlayerEmbedsTimer() {
        if (currentMatchSession && currentMatchSession.forceUpdateLobbyEmbed) {
            currentMatchSession.forceUpdateLobbyEmbed = false;
            sendLobbyEmbed();
        }

        if ((new Date() - lastPlayerEmbedSent) / 1000 > 5) {
            if (currentMatchSession) {
                sendEmbeds();
            }
            lastPlayerEmbedSent = new Date();
        }
    }
    
    async function sendEmbeds() {
        if (currentMatchSession.currentWave == 0) {
            sendLobbyEmbed();
            return;
        }
        for (let player of currentMatchSession.playerList) {
            if (player.Changed == true) {
                player.Changed = false;
                let playerEmbed = helper.createPlayerEmbed(player);
                let pMsgObj = currentMatchSession.getPlayerMsgObject(player.id);
                if (pMsgObj == null) {
                    let steamid = helper.h2d(player.steamid);
                    steam.getPlayerSummaries(steamid).then(data => {
                        let steamData = JSON.parse(data);
                        player.SteamData = steamData;
                        player.Changed = true;
                    });
        
                    let playerMsgObj = await discord.SendMsg(playerEmbed);
                    currentMatchSession.playerMsgObjArray.push({ msgobj: playerMsgObj, id: `${currentMatchSession.matchSessionId}_${player.id}` })
                }
                else {
                    pMsgObj.msgobj.edit(playerEmbed);
                }
            }
        }
    }

    async function sendLobbyEmbed() {
        let embed = helper.createLobbyEmbed(currentMatchSession);

        if (!currentMatchSession.matchDataMsgObj)
            currentMatchSession.matchDataMsgObj = await discord.SendMsg(embed);
        else {
            currentMatchSession.matchDataMsgObj.edit(embed);
        }
    }

    kf2listener.startServer();
})();



