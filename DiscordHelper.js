const Discord = require('discord.js');
const kf2helper = require('./KF2Helper')

class DiscordHelper {
    static getDateTime = () => {
        let d = new Date();
        let year = d.getFullYear();
        let month = `0${d.getMonth()+1}`.slice(-2);
        let day = `0${d.getDay()}`.slice(-2);

        let h = `0${d.getHours()}`.slice(-2);
        let m = `0${d.getMinutes()}`.slice(-2);
        let s = `0${d.getSeconds()}`.slice(-2);

        return `${day}/${month}/${year} ${h}:${m}:${s}`;
    }

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

        let color = this.getColor(kf2MsgData.healthpercent);
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(kf2MsgData.name, steamAvatarUrl, steamProfileUrl)
            .setDescription(kf2MsgData.message)
            .setFooter(`${kf2MsgData.perkname} ${kf2MsgData.perklevel}`, perkUrl);;
        
        return embed;
    }

    static CreateLobbyEmbed(kf2MsgData) {
        let embed = new Discord.MessageEmbed()
            .setColor("#00ff00")
            .setTitle("Match waiting in lobby")
            .addFields(
                { name: "Map Name:", value: kf2MsgData.mapname, inline: true },
                { name: "Game Info:", value: `${kf2MsgData.gamedifficulty} - ${kf2MsgData.gamelength} (${kf2MsgData.totalwave})`, inline: true }
            )
            .setFooter(`Match created on: ${kf2MsgData.createdon}`);

        if (Symbol.iterator in Object(kf2MsgData.playerlist)) {
            for (let player of kf2MsgData.playerlist) {
                embed.addField("Player: ", `${player.ready == true ? this.emoji.checkmark : this.emoji.x} ${player.playername} - ${player.perkname} ${player.perklevel}`);
                if (player.ready == false)
                    embed.setColor("#ff0000");
            }
        }
        else {
            embed.addField("Player: ", "none");
            embed.setColor("#0000ff");
        }

        return embed;
    }

    static CreatePlayerEmbed(pData) {
        let color = this.getColor(pData.healthpercent);
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(pData.playername)
            .addFields({ name: "Kills:", value: pData.kills})

        return embed;
    }

    static emoji = {
        checkmark: ":white_check_mark:",
        x: ":x:"
    }
}

module.exports = DiscordHelper