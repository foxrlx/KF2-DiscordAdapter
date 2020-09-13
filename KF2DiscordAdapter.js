const config = require('config');
const logger = require('./Logging');
const helper = require('./DiscordHelper');
const SteamHelper = require('./SteamHelper');
const DiscordGateway = require('./DiscordGateway');
const KF2Listener = require('./KF2Listener');

(() => {    
    let token = config.get("Discord.Token");
    let channelId = config.get("Discord.ChannelId")
    let steamToken = config.get("Steam.Token");
    
    let steam = new SteamHelper(steamToken);
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
        let steamid = h2d(content.steamid);
        steam.GetPlayerSummaries(steamid).then(data => {
            let steamData = JSON.parse(data);

            let embed = helper.CreateMessageEmbed(content, steamData);
            discord.SendMsg(embed);
        });
    }

    kf2listener.StartServer();
})();


function h2d(s) {

    function add(x, y) {
        var c = 0, r = [];
        var x = x.split('').map(Number);
        var y = y.split('').map(Number);
        while(x.length || y.length) {
            var s = (x.pop() || 0) + (y.pop() || 0) + c;
            r.unshift(s < 10 ? s : s - 10); 
            c = s < 10 ? 0 : 1;
        }
        if(c) r.unshift(c);
        return r.join('');
    }

    var dec = '0';
    s.split('').forEach(function(chr) {
        var n = parseInt(chr, 16);
        for(var t = 8; t; t >>= 1) {
            dec = add(dec, dec);
            if(n & t) dec = add(dec, '1');
        }
    });
    return dec;
}