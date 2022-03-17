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
        if (kf2MsgData.perkName)
        {
            perkUrl = kf2helper.KF2PerkImageUrl[kf2MsgData.perkName]
        }

        let color = this.getColor(kf2MsgData.healthpercent);
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(kf2MsgData.name, steamAvatarUrl, steamProfileUrl)
            .setDescription(kf2MsgData.message)
            .setFooter(`${kf2MsgData.perkName} ${kf2MsgData.perkLevel}`, perkUrl);;
        
        return embed;
    }

    static createLobbyEmbed(matchData) {
        let title = "Match waiting in lobby";
        if (matchData.isWaveInProgress()) {
            let waveInfo = `Wave: ${matchData.currentWave}/${matchData.getTotalWave()}`;
            if (matchData.isBossWave())
                waveInfo = "Boss Wave";
            title = `Match in proggress - ${waveInfo}`;
        }
        if (matchData.isTraderOpen())
            title = `Match in proggress - Trader Time - Next Wave: ${matchData.getNextWave()}`;
        if (matchData.isMatchEnded()) {
            let matchEndMsg = "";
            if (matchData.isBossDead()) {
                matchEndMsg = `squad killed ${matchData.bossData.name}`;
            }
            if (matchData.isBossWave() && !matchData.isBossDead()) {
                matchEndMsg = `squad wiped out by ${matchData.bossData.name}`;
            }
            if (!matchData.isBossWave())
            {
                matchEndMsg = `squad wiped out at wave ${matchData.currentWave} of ${matchData.getTotalWave()}`;
            }
            let matchDuration = moment.duration(matchData.endedTime.diff(matchData.startedTime));
            title = `Match ended ${matchEndMsg} Duration: ${matchDuration.hours()} hours ${matchDuration.minutes()} mins ${matchDuration.seconds()} secs`;
        }
        let embed = new Discord.MessageEmbed()
            .setColor("#00ff00")
            .setTitle(title)
            .addFields(
                { name: "Map Name:", value: matchData.mapName, inline: true },
                { name: "Game Info:", value: `${matchData.gameDifficulty} - ${matchData.gameLength} (${matchData.getTotalWave()} waves)`, inline: true }
            );
            
            let footer = []
            footer.push(`Match created: ${this.getDateTime(matchData.createdTime)}`);

            if (matchData.startedTime != null)
                footer.push(`Started: ${this.getDateTime(matchData.startedTime)}`);

            if (matchData.isBossDead())
                footer.push(`Boss Killed: ${this.getDateTime(matchData.bossKilledTime)}`)

            if (matchData.endedTime != null)
                footer.push(`Ended: ${this.getDateTime(matchData.endedTime)}`);
            embed.setFooter(footer.join("\n"));
        
        if (matchData.currentWave > 0 && !matchData.traderActive)
            embed.addField("Mobs:", `${matchData.aiRemaining}/${matchData.aiTotal}`, true);
        if (matchData.currentWave > 0 && matchData.traderActive) {
            let duration = moment.duration(matchData.waveEndTime.diff(matchData.waveStartTime));
            embed.addField("Last Wave Duration:", `${(duration.hours() * 60) + duration.minutes()} mins ${duration.seconds()} secs`, true);
        }

        if (matchData.isBossWave()) {
            let bossHealth = "";
            if (matchData.isBossSpawned())
                bossHealth = ` - **Health**: ${matchData.getBossHealth()}/${matchData.bossData.maxHealth}`;
            if (matchData.isBossSpawned() && matchData.isBossDead()) {
                let duration = moment.duration(matchData.bossKilledTime.diff(matchData.bossSpawnTime));
                let bossKiller = matchData.getBossKiller();
                let bossKilledBy = "";
                if (bossKiller)
                    bossKilledBy = ` **by:** ${bossKiller.playerName}`;
                bossHealth = ` - **DEAD** **Killed in:** ${(duration.hours() * 60) + duration.minutes()} mins ${duration.seconds()} secs${bossKilledBy}`;
            }
            embed.addField("Boss:", `${matchData.bossData.name}${bossHealth}`);
        }

        var playersText = [];
        if (Array.isArray(matchData.playerList) && matchData.playerList.length > 0) {
            for (let player of matchData.playerList) {
                let icon = this.emoji.x;
                if (player.ready == true)
                    icon = this.emoji.checkmark;
                if (player.left)
                    icon = this.emoji.noEntrySign;
                
                playersText.push(`${icon} ${player.playerName}${player.left ? "(disconnected)" : ""} - ${player.perkName} ${player.perkLevel}`);
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

        if (pData.steamData && pData.steamData.response.players.length > 0) {
            steamAvatarUrl = pData.steamData.response.players[0].avatarmedium;
            steamProfileUrl = pData.steamData.response.players[0].profileurl;
        }
        if (pData.perkName)
        {
            perkUrl = kf2helper.KF2PerkImageUrl[pData.perkName]
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

        let color = this.getColor(pData.maxHealth > 0 ? pData.health / pData.maxHealth * 100 : 0);
        if (pData.left)
            color = "#ff0000";
        let embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor(pData.playerName, steamAvatarUrl, steamProfileUrl)
            .addFields(
                { name: "Health:", value: `${pData.health}/${pData.maxHealth}`, inline: true },
                { name: "Armor:", value: `${pData.armor}/${pData.maxArmor}`, inline: true },
                { name: "K/D/A:", value: `${pData.kills}/${pData.deaths}/${pData.assists}`, inline: true },
                { name: "Dosh:", value: pData.dosh, inline: true },
                { name: "Ping:", value: pData.ping, inline: true },
            );

            if (items.length > 0)
                embed.addField("Inventory:", items.join("\n"))

        if (pData.spawned == false) {
            embed.setFooter(`Waiting`)
        }
        else if (pData.health <= 0 && pData.spawned == true) {
            embed.setFooter(`Dead`);
        }

        else if (pData.left) {
            embed.setFooter(`player left at wave ${matchData.currentWave} - ${this.getDateTime(pData.leftTime)}`);
        }
        else {
            embed.setFooter(`${pData.perkName} ${pData.perkLevel}`, perkUrl);
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