"use strict"; /* eslint-env node */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */
var debug = !process.env.NODE_ENV;
console.log("Environment: ", process.env.NODE_ENV || "dev");
console.log("Debugging: ", debug);

// Load Node Modules & Custom Modules
var express = require("express"),
	app = express(),
	server = app.listen(process.env.PORT || (process.argv[2] || 8000), function expressServerListening () {
		console.log(server.address());
	}),
	helmet = require("helmet"),
	io = require("socket.io"),
	listener = io.listen(server),
	pugStatic = require("pug-static"),
	_ = require("lodash"),
	fs = require("fs");
	// utils = require("./utils.js");

// Express Middleware
app.set("view engine", "pug");
app.use(helmet());
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/dist"));
app.use(pugStatic(__dirname + "/views"));
// var router = require("./routes/routes.js");
// app.use("/", router);

// Socket.io Control
var clients = {};
listener.sockets.on("connection", function connectionDetected (socket) {
	socket.on("refreshRequest", function processRefreshRequest (options) {	
	
	});

	socket.on("newAccount", function processNewAccount (data) {
		fs.readFile("data.json", function (err, oldData) {
			if (err) return console.log(err);
			var json = JSON.parse(oldData);

			json[data[0]] = data[1];
			fs.writeFile("data.json", JSON.stringify(json, null, "\t"), function(err) {
				if (err) return console.log(err);
			});
		});	
	});

	socket.on("login", function processLoginRequest (userData) {
		fs.readFile("data.json", function (err, data) {
			if (err) return console.log(err);
			var json = JSON.parse(data);
			var userObj = _.findLast(json, function(n) {
				return n.email == userData.email && n.password == userData.password;
			});
			if (userObj !== undefined) {
				socket.emit("successLogin", userObj);
			} else {
				socket.emit("failLogin");
			}
		});
	});

	socket.on("requestUserData", function processUserDataRequest(userData) {
		fs.readFile("data.json", function(err, data) {

			if (err) return console.log(err);
			var json = JSON.parse(data);
			json = _.reject(_.orderBy(json, "time", "desc"), userData);
			socket.emit("userData", json);
		});
	});

	// TODO: merge with Jason's functions
	socket.on("startedInnovationBoard", function (userData) {
		debug && console.log("new connection: " + socket.id);
		if (userData) {
			// Logged in!
			clients[socket.id] = Object.assign({}, userData);
			delete clients[socket.id].password; // TODO: better way to do this
			listener.emit("innovationBoardConnectedClients", clients);
		} else {
			// Not logged in :(
			// TODO: just secretly listening in to the conversation
		}

		// debug && console.log(Object.keys(listener.sockets.sockets));
		// debug && console.log(clients);
	});

	// Important! Do not change event name! Built-in socket.io function!
	socket.on("disconnect", function () {
		debug && console.log("user disconnected: " + socket.id);
		delete clients[socket.id];
		listener.emit("innovationBoardConnectedClients", clients);
	});

});