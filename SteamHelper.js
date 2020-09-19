var request = require('request');
class SteamHelper {
    constructor(token) {
        this.token = token;
    }

    getPlayerSummaries(steamid) {
        let self = this;
        return new Promise(function (resolve, reject) {
            var options = {
                method: 'get',
                url: `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${self.token}&steamids=${steamid}`,
            }
            request(options, function(error, response, body) {
                resolve(body);
            });
        });
    }
}

module.exports = SteamHelper;