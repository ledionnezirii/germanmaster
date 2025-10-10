const User = require('../models/User'); // Your User model

// Albanian league tiers and promotion/demotion percentages
const LEAGUES = [
  { tier: 'Fillestar', promotionPercent: 70, demotionPercent: 0 },
  { tier: 'Punëtor', promotionPercent: 68, demotionPercent: 5 },
  { tier: 'Kokëfortë', promotionPercent: 60, demotionPercent: 7 },
  { tier: 'Ngjitës', promotionPercent: 55, demotionPercent: 10 },
  { tier: 'Këmbëngulës', promotionPercent: 50, demotionPercent: 10 },
  { tier: 'Luftëtar', promotionPercent: 40, demotionPercent: 15 },
  { tier: 'Mjeshtër', promotionPercent: 30, demotionPercent: 15 },
  { tier: 'Kampion', promotionPercent: 20, demotionPercent: 20 },
];

let lastUpdateTimestamp = null;
const LEAGUE_PERIOD_MS = 1 * 60 * 1000; // 1 minute

function getLeagueByTier(tier) {
  return LEAGUES.find((league) => league.tier === tier);
}

// Update leagues for all users based on XP rankings, promotions and demotions
async function updateLeagues() {
  try {
    const now = Date.now();
    if (lastUpdateTimestamp && now - lastUpdateTimestamp < LEAGUE_PERIOD_MS) {
      return;
    }
    lastUpdateTimestamp = now;

    const users = await User.find().sort({ xp: -1 }).exec();

    const leagueGroups = {};
    LEAGUES.forEach((league) => leagueGroups[league.tier] = []);

    users.forEach((user) => {
      const leagueTier = user.currentLeague || 'Fillestar';
      leagueGroups[leagueTier] ? leagueGroups[leagueTier].push(user) : leagueGroups['Fillestar'].push(user);
    });

    for (let i = 0; i < LEAGUES.length; i++) {
      const league = LEAGUES[i];
      const group = leagueGroups[league.tier];
      if (!group || group.length === 0) continue;

      group.sort((a, b) => b.xp - a.xp);

      const promoteCount = Math.floor((league.promotionPercent / 100) * group.length);
      const demoteCount = Math.floor((league.demotionPercent / 100) * group.length);

      // Promotion
      if (i > 0 && promoteCount > 0) {
        const higherLeague = LEAGUES[i - 1].tier;
        for (let j = 0; j < promoteCount; j++) {
          const user = group[j];
          if (user.currentLeague !== higherLeague) {
            console.log(`↑ ${user.emri} ${user.mbiemri} u ngjit nga ${user.currentLeague} → ${higherLeague}`);
            user.currentLeague = higherLeague;
            await user.save();
          }
        }
      }

      // Demotion
      if (i < LEAGUES.length - 1 && demoteCount > 0) {
        const lowerLeague = LEAGUES[i + 1].tier;
        for (let j = group.length - demoteCount; j < group.length; j++) {
          const user = group[j];
          if (user.currentLeague !== lowerLeague) {
            console.log(`↓ ${user.emri} ${user.mbiemri} u demotua nga ${user.currentLeague} → ${lowerLeague}`);
            user.currentLeague = lowerLeague;
            await user.save();
          }
        }
      }

      // Keep middle users in same league
      for (let j = promoteCount; j < group.length - demoteCount; j++) {
        const user = group[j];
        if (user.currentLeague !== league.tier) {
          user.currentLeague = league.tier;
          await user.save();
        }
      }
    }

    console.log('Leagues updated automatically at', new Date().toLocaleTimeString());
  } catch (err) {
    console.error('Error updating leagues automatically:', err);
  }
}

// User league info
async function getUserLeague(req, res) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      userId: user._id,
      currentLeague: user.currentLeague || 'Unassigned',
      highestLeagueRank: user.highestLeagueRank || null,
      xp: user.xp,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// All users league info
async function getAllLeagues(req, res) {
  try {
    const users = await User.find({}, 'emri mbiemri xp currentLeague highestLeagueRank').sort({ xp: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Week period
function getCurrentWeekPeriod() {
  const now = new Date();
  const day = now.getDay();
  const daysSinceMonday = (day + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
}

function getCurrentWeekPeriodHandler(req, res) {
  // Përditëso ligat direkt kur kërkohet
  updateLeagues().then(() => {
    const { startOfWeek, endOfWeek } = getCurrentWeekPeriod();
    const now = new Date();
    let diffMs = endOfWeek - now;
    if (diffMs < 0) diffMs = 0;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    res.status(200).json({
      periodStart: startOfWeek.toISOString(),
      periodEnd: endOfWeek.toISOString(),
      timeLeft: { days, hours, minutes, seconds },
      lastLeagueUpdate: lastUpdateTimestamp ? new Date(lastUpdateTimestamp).toISOString() : null
    });
  });
}

module.exports = {
  updateLeagues,
  getUserLeague,
  getAllLeagues,
  getCurrentWeekPeriod,
  getCurrentWeekPeriodHandler
};
