const express = require("express");
const { getLeaderboard, getUserStats, PUNISHMENTS } = require("../db/helpers");

const router = express.Router();

router.get("/dashboard", (req, res) => {
  const leaderboard = getLeaderboard();
  const myStats = getUserStats(req.session.userId);
  const myRank = leaderboard.findIndex((u) => u.id === req.session.userId) + 1;

  res.render("dashboard", {
    leaderboard,
    myStats,
    myRank,
    punishments: PUNISHMENTS,
    userId: req.session.userId,
    userName: req.session.userName,
  });
});

module.exports = router;
