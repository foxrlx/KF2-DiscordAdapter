const Discord = require('discord.js');

class DiscordHelper {
    static getColor(value) {
        this.r = 255 - (255 * (value / 100));
        this.g = 255 * (value / 100);
        this.b = 0;
        return '#' + ('0'+Math.floor(this.r).toString(16)).slice(-2) + ('0'+Math.floor(this.g).toString(16)).slice(-2) + ('0'+Math.floor(this.b).toString(16)).slice(-2);
      }

      
    static CreateMessageEmbed(kf2MsgData) {
        let color = this.getColor(kf2MsgData.health);
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(kf2MsgData.name);
        
        return embed;
    }
}

module.exports = DiscordHelper