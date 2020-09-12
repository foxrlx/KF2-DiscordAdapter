const config = require('config');
const logger = require('./Logging');
const helper = require('./DiscordHelper');
const DiscordGateway = require('./DiscordGateway');
const kf2listener = require('./KF2Listener');
const KF2Listener = require('./KF2Listener');

(() => {
    let token = config.get("Discord.Token");
    let channelId = config.get("Discord.ChannelId")
    
    let discord = new DiscordGateway(token, channelId);
    discord.DiscordReadyHandler = () => {
        logger.log("Discord", 'Logged In');
    }
    discord.DiscordMessageHandler = msg => {
        logger.log("Discord", `${msg.author.username}: ${msg.content}`);
    }
    discord.Login();

    let kf2listener = new KF2Listener(7070);
    kf2listener.KF2MessageEventHandler = content => {
        console.log(content);
        let embed = helper.CreateMessageEmbed(content);
        discord.SendMsg(embed);
    }

    kf2listener.StartServer();
})();
