const net = require('net');
const client = new net.Socket();
const port = 7070;
const host = '127.0.0.1';

client.connect(port, host, function() {
    console.log('Connected');
    let data = {
        "code": "KF2_MSG",
        "content": {
            "steamid": "0x01100001005F213C",
            "name": "Fox",
            "perkname": "Berserker",
            "health": 70,
            "message": "test"
        }
    };
    client.write(JSON.stringify(data));
});
