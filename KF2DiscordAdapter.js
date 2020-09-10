const config = require('config');
const logger = require('./Logging');
const DiscordGateway = require('./DiscordGateway');

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
})();