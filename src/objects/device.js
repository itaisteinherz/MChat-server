module.exports = class Device { // TODO: Check if I even need to set getters and setters (in all files).
    constructor(options) {
        if (arguments.length === 1 && typeof options === "object") {
            this._nickname = options["nickname"] || "";
            this._UUID = options["UUID"];
            this._passphrase = options["passphrase"];
        } else {
            [this._nickname, this._UUID, this._passphrase] = arguments;
        }
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
