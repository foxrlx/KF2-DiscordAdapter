const net = require('net');
const logger = require('./Logging');
const kf2helper = require('./KF2Helper');

class KF2Listener {
    serverObj;
    socket;
    kf2MessageEventHandler;
    kf2MatchCreatedEventHandler;
    kf2MatchLobbyDataEventHandler;
    kf2ConnectionState;
    dataBuffer;
    constructor(port) {
        this.dataBuffer = "";
        this.port = port;
        this.KF2ConnectionState = kf2helper.CLOSED;
    }
    log(msg) {
        logger.log('KF2Listener', msg);
    }

    startServer() {
        this.serverObj = net.createServer();
        this.serverObj.listen(this.port, () => {
            this.log('KF2 LISTENER SERVER RUNNING ON PORT: ' + this.port);
            this.KF2ConnectionState = kf2helper.WAITING;
        })

        this.serverObj.on('connection', sock => {
            this.socket = sock;
            this.log('Connection Received: ' + sock.remoteAddress);
            this.KF2ConnectionState = kf2helper.CONNECTED;

            sock.on('data', data => {
                this.onDataReceivedHandler(data);
            })
            sock.on('error', error => {
                this.log('Connection to KF2 Lost: ' + error.code);
            })
            sock.on('close', () => {
                this.log('Connection to KF2 Closed');
            })
        })
    }

    onDataReceivedHandler(data) {
        if (data.indexOf('\n') < 0) {
            this.dataBuffer += data;
        }
        else {
            this.dataBuffer += data;
            this.log(this.dataBuffer);
            try {
                var jsonData = JSON.parse(this.dataBuffer);
                this.dataBuffer = "";
                switch (jsonData.code) {
                    case 'KF2_MSG': {
                        this.log(`${jsonData.content.name} (${jsonData.content.perk}) said: ${jsonData.content.message}`)
                        if (this.kf2MessageEventHandler)
                            this.kf2MessageEventHandler(jsonData.content);

                        break;
                    }
                    case 'KF2_MATCHCREATED': {
                        this.log("New Match Created");
                        if (this.kf2MatchCreatedEventHandler)
                            this.kf2MatchCreatedEventHandler(jsonData.content);
                        break;
                    }
                    case 'KF2_LOBBY_UPDATE': {
                        //this.log("Lobby Update");
                        if (this.kf2MatchLobbyDataEventHandler)
                            this.kf2MatchLobbyDataEventHandler(jsonData.content);
                        break;
                    }
                }
            }
            catch (ex) {
                logger.log('KF2Listener', "ERROR PARSING RECEIVED JSON STRING FROM KF2:\n" + this.dataBuffer);
                this.dataBuffer = "";
            }
        }
    }
}
module.exports = KF2Listener