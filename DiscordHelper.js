const Discord = require('discord.js');
const kf2helper = require('./KF2Helper');
const { match } = require('assert');
const moment = require('moment');

class DiscordHelper {
    static getDateTime = (time) => {
        return time.format("DD/MM/YYYY - HH:mm:ss");
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

      
    static createMessageEmbed(kf2MsgData, steamData) {
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

    static createLobbyEmbed(matchData) {
        let title = "Match waiting in lobby";
        if (matchData.currentWave > 0 && !matchData.traderActive && !matchData.matchEnded)
            title = `Match in proggress - Wave: ${matchData.currentWave}/${matchData.totalWave}`;
        if (matchData.currentWave > 0 && matchData.traderActive && !matchData.matchEnded)
            title = `Match in proggress - Trader Time - Next Wave: ${matchData.currentWave+1}`;
        if (matchData.matchEnded)
            title = `Match ended at wave ${matchData.currentWave} of ${matchData.totalWave}`;
        let embed = new Discord.MessageEmbed()
            .setColor("#00ff00")
            .setTitle(title)
            .addFields(
                { name: "Map Name:", value: matchData.mapName, inline: true },
                { name: "Game Info:", value: `${matchData.gameDifficulty} - ${matchData.gameLength} (${matchData.totalWave})`, inline: true }
            );
            
            let footer = []
            footer.push(`Match created: ${this.getDateTime(matchData.createdTime)}`);

            if (matchData.startedTime != null)
                footer.push(`Started: ${this.getDateTime(matchData.startedTime)}`);

            if (matchData.endedTime != null)
                footer.push(`Ended: ${this.getDateTime(matchData.endedTime)}`);
            embed.setFooter(footer.join("\n"));
        
        if (matchData.currentWave > 0 && !matchData.traderActive)
            embed.addField("Mobs:", `${matchData.aiRemaining}/${matchData.aiTotal}`, true);
        if (matchData.currentWave > 0 && matchData.traderActive) {
            let duration = moment.duration(matchData.waveEndTime.diff(matchData.waveStartTime));
            embed.addField("Last Wave Duration:", `${(duration.hours() * 60) + duration.minutes()} mins ${duration.seconds()} secs`, true);
        }

        var playersText = [];
        if (Array.isArray(matchData.playerList) && matchData.playerList.length > 0) {
            for (let player of matchData.playerList) {
                let icon = this.emoji.x;
                if (player.ready == true)
                    icon = this.emoji.checkmark;
                if (player.left)
                    icon = this.emoji.noEntrySign;
                
                playersText.push(`${icon} ${player.playername}${player.left ? "(disconnected)" : ""} - ${player.perkname} ${player.perklevel}`);
                if (player.ready == false)
                    embed.setColor("#ff0000");
            }
            if (matchData.playerList.length > 0)
                embed.addField("Players: ", playersText.join("\n"));
        }
        else {
            embed.addField("Player: ", "none");
            embed.setColor("#0000ff");
        }

        return embed;
    }

    static createPlayerEmbed(pData, matchData) {
        let steamAvatarUrl = "https://arte.folha.uol.com.br/esporte/2016/07/30/estadio-olimpico/images/load.gif";
        let steamProfileUrl = "";
        let perkUrl = "";
        console.log(pData.steamData);

        if (pData.steamData && pData.steamData.response.players.length > 0) {
            steamAvatarUrl = pData.steamData.response.players[0].avatarmedium;
            steamProfileUrl = pData.steamData.response.players[0].profileurl;
        }
        if (pData.perkname)
        {
            perkUrl = kf2helper.KF2PerkImageUrl[pData.perkname]
        }

        let items = [];
        if (Array.isArray(pData.inventory)) {
            for (let item of pData.inventory) {
                if (kf2helper.KF2IgnoreInventory.indexOf(item.itemClassName) >= 0)
                    continue;
                let weaponStats = pData.getWeaponStats(item.itemClassName);
                let weaponStatsText = "";
                let spareAmmo = item.spareAmmoCount > 0 ? `/${item.spareAmmoCount}` : "";
                let ammo = item.isMelee ? "" : ` (${item.ammoCount}${spareAmmo})`;
                if (weaponStats) {
                    weaponStatsText = ` **Headshots:** ${weaponStats.headShots} **Dmg. Dealt**: ${weaponStats.damageAmount}`
                }
                let itemText = `**Weapon:** ${item.itemName}${ammo}${weaponStatsText}`;
                items.push(itemText);
            }
        }

        let color = this.getColor(pData.maxhealth > 0 ? pData.health / pData.maxhealth * 100 : 0);
        if (pData.left)
            color = "#ff0000";
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(pData.playername, steamAvatarUrl, steamProfileUrl)
            .addFields(
                { name: "Health:", value: `${pData.health}/${pData.maxhealth}`, inline: true },
                { name: "K/D/A:", value: `${pData.kills}/${pData.deaths}/${pData.assists}`, inline: true },
                { name: "Dosh:", value: pData.dosh, inline: true },
                { name: "Ping:", value: pData.ping, inline: true },
            );

            if (items.length > 0)
                embed.addField("Inventory:", items.join("\n"))

        if (pData.left) {
            embed.setFooter(`player left at wave ${matchData.currentWave} - ${this.getDateTime(pData.leftTime)}`);
        }
        else {
            embed.setFooter(`${pData.perkname} ${pData.perklevel}`, perkUrl);
        }

        return embed;
    }

    static emoji = {
        checkmark: ":white_check_mark:",
        x: ":x:",
        noEntrySign: ":no_entry_sign:"
    }
}

module.exports = DiscordHelper