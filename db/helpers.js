const db = require("./database");

const CATEGORIES = {
  NORMAL: { label: "Normal Beer", description: "Home or night out beer", points: 1, emoji: "🍺" },
  BEFORE_NOON: { label: "Pre-Noon Beer", description: "Before 13:00 (with sleep since 05:30)", points: 2, emoji: "🌅" },
  SCENIC: { label: "Scenic Beer", description: "Very scenic setting (needs council vote)", points: 3, emoji: "🏔️" },
  LADY_BOUGHT: { label: "Bought by a Lady", description: "A beer bought to you by a lady (not family)", points: 4, emoji: "💃" },
  PERFECTLY_SPLIT: { label: "Perfectly Split G", description: "A perfectly split G", points: 4, emoji: "✂️" },
};

const PUNISHMENTS = {
  1: "No punishment — honor, respect, free pass on hole 1, free beer + unique pint glass 🏆",
  2: "Must toast the winner in a pub 🥂",
  3: "Must wear an outfit made up by the council 👗",
  4: 'The infamous "I do not wish to be recorded" stunt 🎬',
  5: "Dyeing hair an unnatural color or buzzcut 💇",
  6: "GRWM for one week 💄",
};

function getLeaderboard() {
  const users = db.prepare("SELECT id, name FROM users").all();

  return users
    .map((user) => {
      const beerPoints = db
        .prepare("SELECT COALESCE(SUM(COALESCE(final_points, base_points)), 0) as total FROM beers WHERE user_id = ? AND status = 'APPROVED'")
        .get(user.id).total;

      const brandCount = db
        .prepare("SELECT COUNT(*) as cnt FROM brand_records WHERE user_id = ?")
        .get(user.id).cnt;

      const brandBonus = Math.floor(brandCount / 5);

      const deductions = db
        .prepare("SELECT COALESCE(SUM(points), 0) as total FROM point_deductions WHERE target_id = ?")
        .get(user.id).total;

      const awardPoints = db
        .prepare("SELECT COALESCE(SUM(points_awarded), 0) as total FROM monthly_awards WHERE user_id = ?")
        .get(user.id).total;

      const beerCount = db
        .prepare("SELECT COUNT(*) as cnt FROM beers WHERE user_id = ? AND status = 'APPROVED'")
        .get(user.id).cnt;

      const total = beerPoints + brandBonus + awardPoints - deductions;

      return {
        id: user.id,
        name: user.name,
        total,
        beerPoints,
        brandCount,
        brandBonus,
        awardPoints,
        deductions,
        beerCount,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function getUserStats(userId) {
  const beerPoints = db
    .prepare("SELECT COALESCE(SUM(COALESCE(final_points, base_points)), 0) as total FROM beers WHERE user_id = ? AND status = 'APPROVED'")
    .get(userId).total;

  const brandCount = db
    .prepare("SELECT COUNT(*) as cnt FROM brand_records WHERE user_id = ?")
    .get(userId).cnt;

  const brandBonus = Math.floor(brandCount / 5);

  const deductions = db
    .prepare("SELECT COALESCE(SUM(points), 0) as total FROM point_deductions WHERE target_id = ?")
    .get(userId).total;

  const awardPoints = db
    .prepare("SELECT COALESCE(SUM(points_awarded), 0) as total FROM monthly_awards WHERE user_id = ?")
    .get(userId).total;

  const unusedPowers = db
    .prepare("SELECT COUNT(*) as cnt FROM special_powers WHERE earner_id = ? AND is_used = 0")
    .get(userId).cnt;

  const beerCount = db
    .prepare("SELECT COUNT(*) as cnt FROM beers WHERE user_id = ? AND status = 'APPROVED'")
    .get(userId).cnt;

  return {
    total: beerPoints + brandBonus + awardPoints - deductions,
    beerPoints,
    brandCount,
    brandBonus,
    awardPoints,
    deductions,
    unusedPowers,
    beerCount,
  };
}

module.exports = { CATEGORIES, PUNISHMENTS, getLeaderboard, getUserStats };
