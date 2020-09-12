const net = require('net');
const logger = require('./Logging');

class KF2Listener {
    ServerObj;
    Socket;
    KF2MessageEventHandler
    constructor(port) {
        this.port = port;
    }
    log(msg) {
        logger.log('KF2Listener', msg);
    }

    StartServer() {
        this.ServerObj = net.createServer();
        this.ServerObj.listen(this.port, () => {
            this.log('KF2 LISTENER SERVER RUNNING ON PORT: ' + this.port);
        })

        this.ServerObj.on('connection', sock => {
            this.Socket = sock;
            this.log('Connection Received: ' + sock.remoteAddress);
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
        console.log(data.toString());
        var jsonData = JSON.parse(data);
        switch (jsonData.code) {
            case 'KF2_MSG': {
                this.log(`${jsonData.content.name} (${jsonData.content.perk}) said: ${jsonData.content.message}`)
                if (this.KF2MessageEventHandler)
                    this.KF2MessageEventHandler(jsonData.content);
            }
        }
    }
}

module.exports = KF2Listener