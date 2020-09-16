const Discord = require('discord.js');

class DiscordGateway {
    DiscordReadyHandler;
    DiscordMessageHandler;
    constructor (token, channelId) {
        this.token = token;
        this.channelId = channelId;
        this.client = new Discord.Client();
        this.RegisterEvents();
    }
    
    Login() {
        this.client.login(this.token);
    }

    async SendMsg(msg) {
        let channel;
        await this.client.channels.fetch(this.channelId).then(c => channel = c );
        return channel.send(msg);
    }

    RegisterEvents() {
        this.client.on('ready', () => {
            if (this.DiscordReadyHandler)
                this.DiscordReadyHandler()
        });

        this.client.on('message', msg => {
            if (msg.channel.type == 'text' && msg.channel.id == this.channelId) {
                if (this.DiscordMessageHandler)
                    this.DiscordMessageHandler(msg);
            }
        });
    }
}

module.exports = DiscordGateway