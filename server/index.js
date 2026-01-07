/*******************************************************
 *      Server Starts From Here                        *
 *******************************************************/
"use strict";

require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const port = process.env.PORT || 4000;
const env = process.env.ENV || "Development";
const server = http.createServer(app);
require("dotenv").config();

app.set("PORT_NUMBER", port);

// MongoDB Connection (optional - app works without it)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// console.log("MONGO_URI", MONGO_URI);

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("| MongoDB       : Connected ✓");
    })
    .catch((err) => {
      console.log("| MongoDB       : Not connected (optional)");
      console.log("|   Error       : " + err.message);
    });
} else {
  console.log("| MongoDB       : Not configured (optional)");
  console.log("|   Info        : Set MONGO_URI env var to enable database features");
}

//  Start the app on the specific interface (and port).
server.listen(port, async () => {
  const data = new Date();
  console.log("|--------------------------------------------");
  console.log("| Environment  : " + env);
  console.log("| Port         : " + port);
  console.log("| Date         : " + data.toJSON().split("T").join(" "));
  console.log("|--------------------------------------------");
  console.log("| Server is running successfully! ");
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

module.exports = server;
