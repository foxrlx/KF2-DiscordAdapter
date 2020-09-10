class Logging {
    static getTime = () => {
        let d = new Date();
        let h = `0${d.getHours()}`.slice(-2);
        let m = `0${d.getMinutes()}`.slice(-2);
        let s = `0${d.getSeconds()}`.slice(-2);

        return `${h}:${m}:${s}`;
    }
    static log = (description, text) => {
        console.log(`${this.getTime()} [${description}] ${text}`)
    }
}

module.exports = Logging