module.exports = class Device {
    constructor() { // NOTE: This function can take one argument - a JSON object containing all of the information, or three arguments - one for each property.
        if (arguments.length === 1) { // TODO: Check if this is the best solution for taking multiple types of arguments.
            if (!arguments[0]["nickname"]) {
                this._nickname = "";
            } else {
                this._nickname = arguments[0]["nickname"];
            }
            this._UUID = arguments[0]["UUID"];
            this._passphrase = arguments[0]["passphrase"];
        } else {
            this._nickname = arguments[0];
            this._UUID = arguments[1];
            this._passphrase = arguments[2];
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
