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

    static h2d(s) {

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

    static CreateLobbyEmbed(matchData) {
        let title = "Match waiting in lobby";
        if (matchData.CurrentWave > 0)
            title = `Match in proggress - Wave: ${matchData.CurrentWave}/${matchData.MatchData.totalwave}`;
        let embed = new Discord.MessageEmbed()
            .setColor("#00ff00")
            .setTitle(title)
            .addFields(
                { name: "Map Name:", value: matchData.MatchData.mapname, inline: true },
                { name: "Game Info:", value: `${matchData.MatchData.gamedifficulty} - ${matchData.MatchData.gamelength} (${matchData.MatchData.totalwave})`, inline: true }
            )
            .setFooter(`Match created on: ${matchData.CreatedOn}`);

        if (Symbol.iterator in Object(matchData.PlayerList) && matchData.PlayerList.length > 0) {
            for (let player of matchData.PlayerList) {
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
        let steamAvatarUrl = "https://arte.folha.uol.com.br/esporte/2016/07/30/estadio-olimpico/images/load.gif";
        let steamProfileUrl = "";
        let perkUrl = "";
        console.log(pData.SteamData);

        if (pData.SteamData && pData.SteamData.response.players.length > 0) {
            steamAvatarUrl = pData.SteamData.response.players[0].avatarmedium;
            steamProfileUrl = pData.SteamData.response.players[0].profileurl;
        }
        if (pData.perkname)
        {
            perkUrl = kf2helper.KF2PerkImageUrl[pData.perkname]
        }

        let color = this.getColor(pData.maxhealth > 0 ? pData.health / pData.maxhealth * 100 : 0);
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(pData.playername, steamAvatarUrl, steamProfileUrl)
            .addFields(
                { name: "Health:", value: `${pData.health}/${pData.maxhealth}`, inline: true },
                { name: "K/D/A:", value: `${pData.kills}/${pData.deaths}/${pData.assists}`, inline: true },
                { name: "Dosh:", value: pData.dosh, inline: true },
                { name: "Ping:", value: pData.ping, inline: true },
            )
            .setFooter(`${pData.perkname} ${pData.perklevel}`, perkUrl);

        return embed;
    }

    static emoji = {
        checkmark: ":white_check_mark:",
        x: ":x:"
    }
}

module.exports = DiscordHelper