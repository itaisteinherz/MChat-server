const neo4j = require("neo4j-driver").v1;

module.exports = class Neo4j {
    constructor(options) {
        this.username = options.username;
        this.password = options.password;
        this.url = options.url;

        this._driver = neo4j.driver(this.url, neo4j.auth.basic(this.username, this.password));
    }

    run(statement, params) {
        var session = this._driver.session();

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

    var data = {},
        record, key;
    for (record of input["records"]) {
        for (key of record["keys"]) { // TODO: Check if this works when there's no "keys" property, but just an "columns" property (the "columns" property appears in the web GUI).
            var fieldIndex = record["_fieldLookup"][key],
                newData;

            if (data[key]) {
                var fieldData = data[key] instanceof Array ? data[key] : [data[key]];

                newData = record["_fields"].slice(fieldIndex, fieldIndex + 1);
                if (newData instanceof Array && newData.length > 1) {
                    fieldData = fieldData.concat(newData);
                } else {
                    fieldData.push(newData instanceof Array ? newData[0] : newData);
                }

                data[key] = fieldData;
            } else {
                newData = record["_fields"].slice(fieldIndex, fieldIndex + 1);
                data[key] = newData instanceof Array && newData.length == 1 ? newData[0] : newData;
            }
        }
    }

    return data;
}
