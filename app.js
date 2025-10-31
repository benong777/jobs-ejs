const express = require("express");
require("express-async-errors");

//-- Extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

require("dotenv").config(); // to load the .env file into the process.env object

//-- Routers
// const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');

//-- Host-csrf middleware
const cookieParser = require("cookie-parser")
const csrf = require("host-csrf");
//-- Middleware order is critical: cookie-parser and session must come before CSRF
app.use(cookieParser(process.env.SESSION_SECRET));

//-- Sessions
const session = require("express-session");

//-- Mongo as a session store
//-- The secretWord value is preserved even if the server is restarted.
//-- If you go to your Mongo DB, you can see the session data there — although it is not human-readable.
const MongoDBStore = require("connect-mongodb-session")(session);
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: mongoURL,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

//-- If the application is running in production, the session cookie won’t work unless SSL is present.
//-- It’s a good policy, but as you are not running in production, you don’t have SSL.
if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

//-- Rate Limiter
app.set('trust proxy', 1);      // rateLimiter - Enable if behind a reverse proxy (Heroku, Bluemax, AWS ELB, Nginx)
app.use(rateLimiter({
    windowMs: 15 * 60 * 1000,   // 15mins
    max: 100,                   // limit each IP to 100 requests per windowMs
  })
);

//-- Middleware
// app.use(express.json());   // Needed?
app.use(helmet());
app.use(cors());
app.use(xss());

app.use(session(sessionParms));
app.use(require("connect-flash")());  //-- Flash Messages

//-- Passport authentication
const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
//-- Set up Passport to work with Express and sessions
app.use(passport.initialize());
/* Set up an Express middleware that runs on all requests,
   checks the session cookie for a user id, and if it finds one,
   deserializes and attaches it to the req.user property */
app.use(passport.session());

//-- Make CSRF token and flash messages available in all views
//-- (CSRF middleware added after sessions and passport)
const csrfMiddleware = csrf.csrf(); // Initialize CSRF middleware
// Apply CSRF middleware globally, or just to routes you want to protect
app.use(csrfMiddleware);

// Middleware to get or refresh token and expose it to views
app.use((req, res, next) => {
  const token = csrf.getToken(req, res); // sets cookie if not present
  res.locals.csrfToken = token;
  res.locals.flashMessages = req.flash();
  next();
});

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sessions", require("./routes/sessionRoutes"));

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", secretWordRouter);

const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

//-- For functional testing
app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

//-- Routes
// app.use('/auth', authRouter);
app.use('/jobs', auth, jobsRouter);

//-- for TESTING
app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

// const start = async () => {
//   try {
//     await require("./db/connect")(process.env.MONGO_URI);

//     app.listen(port, () =>
//       console.log(`Server is listening on port ${port}...`)
//     );
//   } catch (error) {
//     console.log(error);
//   }
// };

// start();

const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };