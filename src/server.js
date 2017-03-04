const pem = require("pem");
const pify = require("pify");
const express = require("express");

const url = require("url");
const http = require("http");
const https = require("https");

const pemP = pify(pem, Promise); // TODO: Check if the second argument is necessarys

const host = "mchat.com";

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
                
            if (!options["key"] || !options["cert"]) {
                let caRootCert;
                
                pemP.createCertificate({
                    days: 1,
                    selfSigned: true
                })
                    .then((caKeys) => {
                        const caRootKey = caKeys.serviceKey;
                        
                        caRootCert = caKeys.certificate;

                        return pemP.createCertificate({
                            serviceCertificate: caRootCert,
                            serviceKey: caRootKey,
                            serial: Date.now(),
                            days: 500,
                            country: "",
                            state: "",
                            locality: "",
                            organization: "",
                            organizationUnit: "",
                            commonName: host
                        });
                    })
                    .then((keys) => {
                        let httpsOptions = Object.assign({}, options, {
                            key: keys.clientKey,
                            cert: keys.certificate,
                            ca: caRootCert
                        });
                        
                        this._httpsServer = https.createServer(httpsOptions, httpsApp).listen(options["httpsPort"], resolve);
                    });
            } else {
                this._httpsServer = https.createServer(options, httpsApp).listen(options["httpsPort"], resolve);
            }
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
