const pem = require("pem");
const pify = require("pify");

const io = require("socket.io");
const socket = require("socket.io-client");

const assert = require("assert");
const http = require("http");
const https = require("https");

const Server = require("../src/server");
const serverConfig = require("../config")["server"];

const pemP = pify(pem, Promise); // TODO: Check if the second argument is necessary

const host = "mchat.com";

let testServer;
let caRootCert;
let sslOptions = {};

describe("Server", function() {
	before("create ssl key and cert", function() {
		const certOpts = {
			days: 1,
			selfSigned: true
		};

		return pemP.createCertificate(certOpts)
			.then(caKeys => {
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
			.then(keys => {
				sslOptions["key"] = keys.clientKey;
				sslOptions["cert"] = keys.certificate;
			});
	});

	describe("#constructor(options)", function() {
		it("should return a new server object", function() {
			testServer = new Server(Object.assign({}, serverConfig, sslOptions));
			assert.equal(testServer instanceof Server, true);

			return testServer.load;
		});
	});

	describe("#get load()", function() { // TODO: Add tests for the http -> https redirect
		it("should return the promise that resolves when the server was started successfully", function() {
			assert.equal(testServer.load instanceof Promise, true);

			return testServer.load
				.then(() => {
					const testIO = io(testServer.httpsServer); // eslint-disable-line no-unused-vars

					const client = socket(`https://localhost:${serverConfig["httpsPort"]}`, {
						ca: caRootCert,
						extraHeaders: {host}
					});

					return pify(client.on("connect"));
				});
		});
	});

	describe("#get httpServer()", function() {
		it("should return the http server", function() {
			assert.equal(testServer.httpServer instanceof http.Server, true);
		});
	});

	describe("#get httpsServer()", function() {
		it("should return the https server", function() {
			assert.equal(testServer.httpsServer instanceof https.Server, true);
		});
	});
});
