const config = require('config');
const logger = require('./Logging');
const helper = require('./DiscordHelper');
const steamHelper = require('./SteamHelper');
const discordGateway = require('./DiscordGateway');
const kf2Listener = require('./KF2Listener');
const matchData = require('./KF2DiscordMatchData');

let currentMatchSession;
let lastPlayerEmbedSent;
let lastLobbyEmbedSent;
let checkEmbedsInterval;
let steam;
(async () => {
    let token = config.get("Discord.Token");
    let channelId = config.get("Discord.ChannelId")
    let steamToken = config.get("Steam.Token");

    steam = new steamHelper(steamToken);
    let discord = new discordGateway(token, channelId);

    lastPlayerEmbedSent = new Date();
    lastLobbyEmbedSent = new Date();
    checkEmbedsInterval = setInterval(checkPlayerEmbedsTimer, 500);

    discord.DiscordReadyHandler = () => {
        logger.log("Discord", 'Logged In');
    }
    discord.DiscordMessageHandler = msg => {
        logger.log("Discord", `${msg.author.username}: ${msg.content}`);
    }
    discord.Login().catch(error => { logger.log("Discord", `Login: ${error}`); });

    let kf2listener = new kf2Listener(7070);

    kf2listener.kf2MessageEventHandler = content => {
        let steamId = helper.h2d(content.steamId);
        steam.getPlayerSummaries(steamId).then(data => {
            let steamData = JSON.parse(data);
            let embed = helper.createMessageEmbed(content, steamData);
            discord.SendMsg(embed);
        });
    }

    kf2listener.kf2MatchCreatedEventHandler = content => {
        currentMatchSession = new matchData(content.matchsession);
    }

    kf2listener.kf2MatchLobbyDataEventHandler = async content => {
        if (content.matchsession != currentMatchSession.matchSessionId)
            return;

        if (!Array.isArray(content.playerList))
            content.playerList = [];

        //console.log(content.playerList);

        currentMatchSession.checkPlayerDataChanged(content.playerList);
        currentMatchSession.checkMatchDataChanged(content);
        currentMatchSession.setMatchData(content);
    }
    function checkPlayerEmbedsTimer() {
        if (currentMatchSession && currentMatchSession.forceUpdateLobbyEmbed) {
            currentMatchSession.matchDataChanged = true;
            currentMatchSession.forceUpdateLobbyEmbed = false;
            sendLobbyEmbed();
        }

        if ((new Date() - lastLobbyEmbedSent) / 1000 > 5) {
            if (currentMatchSession) {
                sendLobbyEmbed();
            }
            lastLobbyEmbedSent = new Date();
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
            if (player.changed == true) {
                player.changed = false;
                let playerEmbed = helper.createPlayerEmbed(player, currentMatchSession);
                let pMsgObj = currentMatchSession.getPlayerMsgObject(player.steamId);
                if (pMsgObj == null) {
                    let steamId = helper.h2d(player.steamId);
                    steam.getPlayerSummaries(steamId).then(data => {
                        let steamData = JSON.parse(data);
                        player.steamData = steamData;
                        player.changed = true;
                        logger.log("SteamAPI", `Data for ${player.playerName} received: ${steamData}`);
                    });
                    let playerMsgObj = await discord.SendMsg(playerEmbed);
                    logger.log("Discord", `Sending new Player Message: ${player.playerName}`);
                    currentMatchSession.playerMsgObjArray.push({ msgobj: playerMsgObj, id: `${currentMatchSession.matchSessionId}_${player.steamId}` })
                }
                else {
                    pMsgObj.msgobj.edit(playerEmbed);
                    logger.log("Discord", `Editing Player Message: ${player.playerName}`);
                }
            }
        }
    }

    async function sendLobbyEmbed() {
        if (currentMatchSession.matchDataChanged == true) {
            currentMatchSession.matchDataChanged = false;
            let embed = helper.createLobbyEmbed(currentMatchSession);

            if (!currentMatchSession.matchDataMsgObj) {
                currentMatchSession.matchDataMsgObj = await discord.SendMsg(embed);
                logger.log("Discord", 'Sending new Lobby Message');
            }
            else {
                currentMatchSession.matchDataMsgObj.edit(embed);
                logger.log("Discord", 'Editing Lobby Message');
            }
        }
    }

    kf2listener.startServer();
})();



