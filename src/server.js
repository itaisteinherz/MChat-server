const fs = require("fs"),
    url = require("url"),
    http = require("http"),
    https = require("https"),
    path = require("path");

const express = require("express");

// Exports

module.exports = class Server { // TODO: Check wether I should use a class or a dictinary as the exports.
    constructor(options) { // TODO: Make this function better.
        // HTTP Server

        const httpServerPromise = new Promise((resolve, reject) => {
            try {
                this._httpApp = express();

                this._httpServer = http.createServer(this._httpApp).listen(options["httpPort"], () => {
                    resolve();
                });

                this._httpApp.all("*", function(req, res) {
                    const newURL = url.format({ // TODO: Improve this solution.
                        protocol: "https:",
                        hostname: req.hostname,
                        port: options["httpsPort"],
                        pathname: req.originalUrl,
                        hash: req.hash
                    });

                    res.redirect(newURL);
                });
            } catch (e) {
                reject(e);
            }
        });

        // HTTPS Server

        const httpsServerPromise = new Promise((resolve, reject) => {
            try {
                this._httpsApp = express();

                const sslOptions = {
                    rejectUnauthorized: false, // NOTE: This is temporary
                    key: fs.readFileSync(path.join(__dirname, "../", options["key"])),
                    cert: fs.readFileSync(path.join(__dirname, "../", options["cert"]))
                };

                if (options["ca"]) { // TODO: Check if this should be an if or added in the above object directly.
                    sslOptions["ca"] = fs.readFileSync(path.join(__dirname, "../", options["ca"]));
                }

                this._httpsServer = https.createServer(sslOptions, this._httpsApp).listen(options["httpsPort"], () => {
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        });

        this._load = Promise.all([httpServerPromise, httpsServerPromise]);
    }

    get load() {
        return this._load;
    }

    get httpApp() {
        return this._httpApp;
    }

    get httpsApp() {
        return this._httpsApp;
    }

    get httpServer() {
        return this._httpServer;
    }

    get httpsServer() {
        return this._httpsServer;
    }
};
