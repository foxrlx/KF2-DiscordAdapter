const config = require('config');
const logger = require('./Logging');
const helper = require('./DiscordHelper');
const SteamHelper = require('./SteamHelper');
const DiscordGateway = require('./DiscordGateway');
const KF2Listener = require('./KF2Listener');
const MatchData = require('./KF2DiscordMatchData');

let currentMatchSession;
let lastPlayerEmbedSent;
let CheckEmbedsInterval;
let steam;
(async () => {
    let token = config.get("Discord.Token");
    let channelId = config.get("Discord.ChannelId")
    let steamToken = config.get("Steam.Token");
    
    steam = new SteamHelper(steamToken);
    let discord = new DiscordGateway(token, channelId);

    lastPlayerEmbedSent = new Date();
    CheckEmbedsInterval = setInterval(CheckPlayerEmbedsTimer, 500);

    discord.DiscordReadyHandler = () => {
        logger.log("Discord", 'Logged In');
    }
    discord.DiscordMessageHandler = msg => {
        logger.log("Discord", `${msg.author.username}: ${msg.content}`);
    }
    discord.Login();

    let kf2listener = new KF2Listener(7070);

    kf2listener.KF2MessageEventHandler = content => {
        let steamid = helper.h2d(content.steamid);
        steam.GetPlayerSummaries(steamid).then(data => {
            let steamData = JSON.parse(data);
            let embed = helper.CreateMessageEmbed(content, steamData);
            discord.SendMsg(embed);
        });
    }

    kf2listener.KF2MatchCreatedEventHandler = content => {
        currentMatchSession = new MatchData(content.matchsession, helper.getDateTime());
    }

    kf2listener.KF2MatchLobbyDataEventHandler = async content => {
        if (content.matchsession != currentMatchSession.MatchSessionId)
            return;

        if (!Array.isArray(content.playerlist))
            content.playerlist = [];

        currentMatchSession.CheckPlayerDataChanged(content.playerlist);
        currentMatchSession.CheckMatchDataChanged(content);
        currentMatchSession.SetMatchData(content);
    }
    function CheckPlayerEmbedsTimer() {
        if (currentMatchSession && currentMatchSession.ForceUpdateLobbyEmbed) {
            currentMatchSession.ForceUpdateLobbyEmbed = false;
            SendLobbyEmbed();
        }

        if ((new Date() - lastPlayerEmbedSent) / 1000 > 5) {
            if (currentMatchSession) {
                SendEmbeds();
            }
            lastPlayerEmbedSent = new Date();
        }
    }
    
    async function SendEmbeds() {
        if (currentMatchSession.CurrentWave == 0) {
            SendLobbyEmbed();
            return;
        }
        for (let player of currentMatchSession.PlayerList) {
            if (player.Changed == true) {
                player.Changed = false;
                let playerEmbed = helper.CreatePlayerEmbed(player);
                let pMsgObj = currentMatchSession.GetPlayerMsgObject(player.id);
                if (pMsgObj == null) {
                    let steamid = helper.h2d(player.steamid);
                    steam.GetPlayerSummaries(steamid).then(data => {
                        let steamData = JSON.parse(data);
                        player.SteamData = steamData;
                        player.Changed = true;
                    });
        
                    let playerMsgObj = await discord.SendMsg(playerEmbed);
                    currentMatchSession.PlayerMsgObjArray.push({ msgobj: playerMsgObj, id: `${currentMatchSession.MatchSessionId}_${player.id}` })
                }
                else {
                    pMsgObj.msgobj.edit(playerEmbed);
                }
            }
        }
    }

    async function SendLobbyEmbed() {
        let embed = helper.CreateLobbyEmbed(currentMatchSession);

        if (!currentMatchSession.MatchDataMsgObj)
            currentMatchSession.MatchDataMsgObj = await discord.SendMsg(embed);
        else {
            currentMatchSession.MatchDataMsgObj.edit(embed);
        }
    }

    kf2listener.StartServer();
})();



