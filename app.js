const express = require("express");
require("express-async-errors");

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

//-- Sessions
require("dotenv").config(); // to load the .env file into the process.env object
const session = require("express-session");

//-- Mongo as a session store
//-- The secretWord value is preserved even if the server is restarted.
//-- If you go to your Mongo DB, you can see the session data there — although it is not human-readable.
const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
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

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", secretWordRouter);

const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);

    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
