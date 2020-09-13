const Discord = require('discord.js');
const kf2helper = require('./KF2Helper')

class DiscordHelper {
    static getColor(value) {
        this.r = 255 - (255 * (value / 100));
        this.g = 255 * (value / 100);
        this.b = 0;
        return '#' + ('0'+Math.floor(this.r).toString(16)).slice(-2) + ('0'+Math.floor(this.g).toString(16)).slice(-2) + ('0'+Math.floor(this.b).toString(16)).slice(-2);
      }

      
    static CreateMessageEmbed(kf2MsgData, steamData) {
        let steamAvatarUrl = "";
        let steamProfileUrl = "";
        let perkUrl = "";

        if (steamData.response.players.length > 0) {
            steamAvatarUrl = steamData.response.players[0].avatarmedium;
            steamProfileUrl = steamData.response.players[0].profileurl;
        }
        if (kf2MsgData.perkname)
        {
            perkUrl = kf2helper.KF2PerkImageUrl[kf2MsgData.perkname]
        }

        let color = this.getColor(kf2MsgData.health);
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(kf2MsgData.name, steamAvatarUrl, steamProfileUrl)
            .setDescription(kf2MsgData.message)
            .setFooter(`${kf2MsgData.perkname} ${kf2MsgData.perklevel}`, perkUrl);;
        
        return embed;
    }
}

module.exports = DiscordHelper