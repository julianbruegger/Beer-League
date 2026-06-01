const express = require("express");
const db = require("../db/database");
const { CATEGORIES } = require("../db/helpers");

const router = express.Router();

router.get("/submit", (req, res) => {
  res.render("submit", { categories: CATEGORIES, error: null, success: null });
});

router.post("/submit", (req, res) => {
  const { description, category, brandName, location, notes, consumedAt } = req.body;

  if (!CATEGORIES[category]) {
    return res.render("submit", { categories: CATEGORIES, error: "Invalid category.", success: null });
  }

  const cat = CATEGORIES[category];
  const isScenic = category === "SCENIC";
  const status = isScenic ? "PENDING" : "APPROVED";
  const finalPoints = isScenic ? null : cat.points;

  const consumed = consumedAt ? new Date(consumedAt).toISOString() : new Date().toISOString();

  db.prepare(`
    INSERT INTO beers (user_id, description, category, base_points, final_points, status, brand_name, location, notes, consumed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.session.userId,
    description.trim(),
    category,
    cat.points,
    finalPoints,
    status,
    brandName?.trim() || null,
    location?.trim() || null,
    notes?.trim() || null,
    consumed
  );

  if (brandName?.trim()) {
    const normalised = brandName.trim().toLowerCase();
    db.prepare("INSERT OR IGNORE INTO brand_records (user_id, brand) VALUES (?, ?)").run(
      req.session.userId,
      normalised
    );
  }

  const msg = isScenic
    ? "Scenic beer submitted for council vote! 🏔️"
    : `Beer logged! +${cat.points} point${cat.points > 1 ? "s" : ""} 🍺`;

  res.render("submit", { categories: CATEGORIES, error: null, success: msg });
});

router.get("/beers", (req, res) => {
  const beers = db.prepare(`
    SELECT b.*, u.name as user_name,
      (SELECT COUNT(*) FROM votes WHERE beer_id = b.id AND approve = 1) as approve_count,
      (SELECT COUNT(*) FROM votes WHERE beer_id = b.id AND approve = 0) as reject_count,
      (SELECT COUNT(*) FROM votes WHERE beer_id = b.id AND user_id = ?) as user_voted
    FROM beers b JOIN users u ON b.user_id = u.id
    ORDER BY b.created_at DESC
  `).all(req.session.userId);

  const totalMembers = db.prepare("SELECT COUNT(*) as cnt FROM users").get().cnt;

  res.render("beers", { beers, categories: CATEGORIES, totalMembers, userId: req.session.userId });
});

router.post("/beers/:id/vote", (req, res) => {
  const beerId = parseInt(req.params.id);
  const { approve } = req.body;

  const beer = db.prepare("SELECT * FROM beers WHERE id = ?").get(beerId);
  if (!beer || beer.status !== "PENDING") return res.redirect("/beers");
  if (beer.user_id === req.session.userId) return res.redirect("/beers");

  db.prepare("INSERT OR REPLACE INTO votes (beer_id, user_id, approve) VALUES (?, ?, ?)").run(
    beerId,
    req.session.userId,
    approve === "1" ? 1 : 0
  );

  const allVotes = db.prepare("SELECT approve FROM votes WHERE beer_id = ?").all(beerId);
  const totalMembers = db.prepare("SELECT COUNT(*) as cnt FROM users").get().cnt;
  const votesNeeded = Math.max(1, totalMembers - 1);

  if (allVotes.length >= votesNeeded) {
    const approveCount = allVotes.filter((v) => v.approve).length;
    const majority = approveCount > allVotes.length / 2;
    db.prepare("UPDATE beers SET status = ?, final_points = ? WHERE id = ?").run(
      majority ? "APPROVED" : "REJECTED",
      majority ? beer.base_points : 1,
      beerId
    );
  }

  res.redirect("/beers");
});

module.exports = router;
