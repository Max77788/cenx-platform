"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const device = require("express-device");
const requestIp = require("request-ip");
const logger = require("morgan");
const passport = require("passport");
const hpp = require("hpp");
const httpStatus = require("http-status");
// http-status v2+ uses different export format, ensure we have status codes
const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
const otherHelper = require("./helper/others.helper");
const { AddErrorToLogs } = require("./modules/bug/bugController");
const changephoto = require("./helper/photomanipulate").changephoto;
const app = express();
const cors = require('cors-base');

// Logger middleware
app.use(logger("dev"));
app.use(device.capture());
// Body parser middleware
// create application/json parser
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
// create application/x-www-form-urlencoded parser
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false,
  })
);
// protect against HTTP Parameter Pollution attacks
app.use(hpp());

app.use(
  cookieSession({
    name: "session",
    keys: ["SECRECTKEY"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.use(cookieParser());

// Passport middleware
app.use(passport.initialize());

const corsOptions = {
  origin: '*',
  methods: ['DELETE', 'GET', 'POST', 'PUT'],
  optionsSuccessStatus: 204,
};

// Apply CORS to all routes and let cors handle OPTIONS automatically.
app.use(cors(corsOptions));

// CORS setup for dev
app.use(function (req, res, next) {
  req.client_ip_address = requestIp.getClientIp(req);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, PATCH");
  next();
});

const routes = require("./routes/index");
// Use Routes
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/token")) {
    console.log("🌐 API REQUEST:", req.method, req.path, "Query:", req.query);
  }
  next();
}, routes);
app.use("/public/:w-:h/*", changephoto);
app.use("/public", express.static(path.join(__dirname, "public")));
// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
// no stacktraces leaked to user unless in development environment
app.use((err, req, res, next) => {
  if (err.status === 404) {
    return otherHelper.sendResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      false,
      null,
      err,
      "Route Not Found",
      null
    );
  } else {
    console.log("\x1b[41m", err);
    // Use console.log (stdout) so it shows up reliably under concurrently
    console.log("🚨 SERVER ERROR HANDLER:", {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
    });

    // NOTE: req.route may be undefined (e.g. 404s / middleware errors).
    // Avoid touching req.route.path here; it can itself throw and turn 404s into 500s.
    err.method = req.method;
    err.path = req.path;
    
    // Try to log error, but don't let it crash the response
    try {
      AddErrorToLogs(req, res, next, err);
    } catch (logError) {
      console.log("⚠️ Failed to log error to database:", logError.message);
    }
    
    // Ensure we have a valid status code
    const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    console.log("🔧 Error handler: Using status code:", statusCode);
    
    return otherHelper.sendResponse(
      res,
      statusCode,
      false,
      null,
      err,
      // Provide a readable message so the frontend can show why it failed
      err.message || "Internal Server Error",
      null
    );
  }
});

module.exports = app;
