const express = require("express");

const url = require("url");
const http = require("http");
const https = require("https");

// Exports

module.exports = class Server {
    constructor(options) { // TODO: Make this function better.
        // HTTP Server

        const httpServerPromise = new Promise((resolve, reject) => {
            try {
                const httpApp = express();

                this._httpServer = http.createServer(httpApp).listen(options["httpPort"], resolve);

                httpApp.all("*", (req, res) => {
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

        const httpsServerPromise = new Promise((resolve) => {
            const httpsApp = express();
                
            this._httpsServer = https.createServer(options, httpsApp).listen(options["httpsPort"], resolve);
        });

        this._load = Promise.all([httpServerPromise, httpsServerPromise]);
    }

    get load() {
        return this._load;
    }

    get httpServer() {
        return this._httpServer;
    }

    get httpsServer() {
        return this._httpsServer;
    }
};
