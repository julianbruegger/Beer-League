require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const SQLiteStore = require("connect-sqlite3")(session);
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: __dirname }),
    secret: process.env.SESSION_SECRET || "beer-league-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use("/", require("./routes/auth"));

const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  next();
};

app.use("/", requireAuth, require("./routes/dashboard"));
app.use("/", requireAuth, require("./routes/beers"));
app.use("/", requireAuth, require("./routes/powers"));

app.get("/rulebook", requireAuth, (req, res) => res.render("rulebook"));

app.get("/", (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`🍺 Beer League running on http://localhost:${PORT}`);
});
