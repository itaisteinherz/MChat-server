const fs = require("fs");
const path = require("path");

const keyPath = "certs/privkey.pem";
const certPath = "certs/fullchain.pem";

module.exports = {
	client: {
		appName: "MChat"
	},
	server: {
		httpPort: 1080,
		httpsPort: 1443,
		key: readFile(keyPath),
		cert: readFile(certPath)
	},
	database: {
		username: "neo4j",
		password: "admin",
		url: "bolt://localhost"
	}
};

function readFile(pathToFile) {
	const joinedPath = path.join(__dirname, pathToFile);
	const pathExists = fs.existsSync(joinedPath);

	return pathExists ? fs.readFileSync(joinedPath, {encoding: "utf8"}) : "";
}
