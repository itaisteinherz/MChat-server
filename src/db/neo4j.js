const neo4j = require("neo4j-driver").v1;

module.exports = class Neo4j {
    constructor(options) {
        this.username = options.username;
        this.password = options.password;
        this.url = options.url;

        this._driver = neo4j.driver(this.url, neo4j.auth.basic(this.username, this.password));
    }

    run(statement, params) {
        const session = this._driver.session();

        return session
            .run(statement, params)
            .then((result) => {
                session.close();
                return _parseData(result);
            });
    }

    closeDriver() { // TODO: Check if I have a better solution for this. Also, check if putting the code inside of a promise makes it any better.
        try {
            this._driver.close();
            return true;
        } catch (e) {
            return false;
        }
    }
};

function _parseData(input) { // TODO: Add tests for this function.
    if (input.length == 0) {
        return;
    }

    let data = {};

    for (const record of input["records"]) {
        for (const key of record["keys"]) { // TODO: Check if this works when there's no "keys" property, but just an "columns" property (the "columns" property appears in the web GUI).
            const fieldIndex = record["_fieldLookup"][key];
            let newData;

            if (data[key]) {
                let fieldData = Array.isArray(data[key]) ? data[key] : [data[key]];

                newData = record["_fields"].slice(fieldIndex, fieldIndex + 1);
                if (Array.isArray(newData) && newData.length > 1) {
                    fieldData = fieldData.concat(newData);
                } else {
                    fieldData.push(Array.isArray(newData) ? newData[0] : newData);
                }

                data[key] = fieldData;
            } else {
                newData = record["_fields"].slice(fieldIndex, fieldIndex + 1);
                data[key] = Array.isArray(newData) && newData.length == 1 ? newData[0] : newData;
            }
        }
    }

    return data;
}
