module.exports = class Device { // TODO: Check if I even need to set getters and setters (in all files).
    constructor(nickname, uuid, passphrase) {
        if (arguments.length === 1 && typeof arguments[0] === "object") {
            this._nickname = arguments[0]["nickname"] || "";
            this._UUID = arguments[0]["UUID"];
            this._passphrase = arguments[0]["passphrase"];
        }
        
        this._nickname = nickname;
        this._UUID = uuid;
        this._passphrase = passphrase;
    }

    get nickname() {
        return this._nickname;
    }

    get UUID() {
        return this._UUID;
    }

    get passphrase() {
        return this._passphrase;
    }

    set nickname(newValue) {
        this._nickname = newValue;
    }

    set UUID(newValue) {
        this._UUID = newValue;
    }

    set passphrase(newValue) {
        this._passphrase = newValue;
    }

    serialize() {
        return {
            "nickname": this.nickname,
            "UUID": this.UUID,
            "passphrase": this.passphrase
        };
    }
};
