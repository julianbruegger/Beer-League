const express = require("express");
const db = require("../db/database");

const router = express.Router();

const POWER_DEDUCTIONS = { SHOEY: 2, SHOTGUN: 1, CHUG: 1 };
const POWER_LABELS = {
  SHOEY: { emoji: "👟", label: "Shoey", desc: "Deduct 2 pts from anyone" },
  SHOTGUN: { emoji: "💨", label: "Shotgun", desc: "Deduct 1 pt (earn every 3rd shotgun)" },
  CHUG: { emoji: "⚡", label: "Chug", desc: "Deduct 1 pt (earn every 3rd chug)" },
};

router.get("/powers", (req, res) => {
  const unusedPowers = db.prepare(`
    SELECT sp.*, u.name as earner_name
    FROM special_powers sp JOIN users u ON sp.earner_id = u.id
    WHERE sp.earner_id = ? AND sp.is_used = 0
    ORDER BY sp.created_at DESC
  `).all(req.session.userId);

  const usedPowers = db.prepare(`
    SELECT sp.*, u.name as earner_name, t.name as target_name
    FROM special_powers sp JOIN users u ON sp.earner_id = u.id
    LEFT JOIN users t ON sp.target_id = t.id
    WHERE sp.earner_id = ? AND sp.is_used = 1
    ORDER BY sp.used_at DESC LIMIT 10
  `).all(req.session.userId);

  const powersUsedAgainstMe = db.prepare(`
    SELECT sp.*, u.name as earner_name
    FROM special_powers sp JOIN users u ON sp.earner_id = u.id
    WHERE sp.target_id = ?
    ORDER BY sp.used_at DESC LIMIT 10
  `).all(req.session.userId);

  const shoeyCount = db.prepare("SELECT COUNT(*) as cnt FROM special_powers WHERE earner_id = ? AND power_type = 'SHOEY'").get(req.session.userId).cnt;
  const shotgunCount = db.prepare("SELECT COUNT(*) as cnt FROM special_powers WHERE earner_id = ? AND power_type = 'SHOTGUN'").get(req.session.userId).cnt;
  const chugCount = db.prepare("SELECT COUNT(*) as cnt FROM special_powers WHERE earner_id = ? AND power_type = 'CHUG'").get(req.session.userId).cnt;

  const otherUsers = db.prepare("SELECT id, name FROM users WHERE id != ? ORDER BY name").all(req.session.userId);

  res.render("powers", {
    unusedPowers,
    usedPowers,
    powersUsedAgainstMe,
    shoeyCount,
    shotgunCount,
    chugCount,
    powerLabels: POWER_LABELS,
    otherUsers,
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

router.post("/powers/earn", (req, res) => {
  const { powerType } = req.body;
  if (!POWER_DEDUCTIONS[powerType]) return res.redirect("/powers");

  const deduction = POWER_DEDUCTIONS[powerType];

  if (powerType === "SHOTGUN" || powerType === "CHUG") {
    const totalRecorded = db.prepare("SELECT COUNT(*) as cnt FROM special_powers WHERE earner_id = ? AND power_type = ?")
      .get(req.session.userId, powerType).cnt;
    const newCount = totalRecorded + 1;
    db.prepare("INSERT INTO special_powers (earner_id, power_type, point_deduction) VALUES (?, ?, ?)").run(
      req.session.userId, powerType, deduction
    );
    if (newCount % 3 === 0) {
      return res.redirect("/powers?success=" + encodeURIComponent(`Power earned! Every 3rd ${powerType.toLowerCase()} grants a deduction. ⚡`));
    }
    const remaining = 3 - (newCount % 3);
    return res.redirect("/powers?success=" + encodeURIComponent(`Recorded! ${remaining} more to earn a deduction power.`));
  }

  db.prepare("INSERT INTO special_powers (earner_id, power_type, point_deduction) VALUES (?, ?, ?)").run(
    req.session.userId, powerType, deduction
  );
  res.redirect("/powers?success=" + encodeURIComponent("Shoey power earned! You can now deduct 2 pts from someone. 👟"));
});

router.post("/powers/use", (req, res) => {
  const powerId = parseInt(req.body.powerId);
  const targetId = parseInt(req.body.targetId);

  const power = db.prepare("SELECT * FROM special_powers WHERE id = ? AND earner_id = ? AND is_used = 0")
    .get(powerId, req.session.userId);

  if (!power) return res.redirect("/powers?error=" + encodeURIComponent("Power not found or already used."));
  if (targetId === req.session.userId) return res.redirect("/powers?error=" + encodeURIComponent("Cannot use power on yourself."));

  const earnerName = db.prepare("SELECT name FROM users WHERE id = ?").get(req.session.userId).name;

  db.prepare("UPDATE special_powers SET is_used = 1, used_at = CURRENT_TIMESTAMP, target_id = ? WHERE id = ?").run(targetId, powerId);
  db.prepare("INSERT INTO point_deductions (target_id, points, reason) VALUES (?, ?, ?)").run(
    targetId,
    power.point_deduction,
    `${earnerName} used a ${power.power_type} power on you`
  );

  const targetName = db.prepare("SELECT name FROM users WHERE id = ?").get(targetId).name;
  res.redirect("/powers?success=" + encodeURIComponent(`Used! ${targetName} loses ${power.point_deduction} point(s). 😈`));
});

module.exports = router;
