const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/database");

const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.render("login", { error: null, registered: req.query.registered });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render("login", { error: "Invalid email or password", registered: null });
  }
  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.isAdmin = user.is_admin === 1;
  res.redirect("/dashboard");
});

router.get("/register", (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
  const { name, email, password, inviteCode } = req.body;

  if (inviteCode !== process.env.INVITE_CODE) {
    return res.render("register", { error: "Invalid invite code. Ask a council member." });
  }
  if (!name || !email || !password) {
    return res.render("register", { error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.render("register", { error: "Password must be at least 6 characters." });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.render("register", { error: "This email is already registered." });
  }

  const hashed = await bcrypt.hash(password, 12);
  const isFirstUser = db.prepare("SELECT COUNT(*) as cnt FROM users").get().cnt === 0;
  db.prepare("INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)")
    .run(name, email.toLowerCase().trim(), hashed, isFirstUser ? 1 : 0);

  res.redirect("/login?registered=1");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;
