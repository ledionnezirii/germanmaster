const Giveaway = require("../models/Giveaway");
const User = require("../models/User");
const cron = require("node-cron");

// ─────────────────────────────────────────────
//  FISHER-YATES SHUFFLE (unbiased)
// ─────────────────────────────────────────────
function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────
//  AUDIT LOG BUILDER
// ─────────────────────────────────────────────
function buildAuditLog(participants, winners) {
  return {
    drawnAt: new Date().toISOString(),
    totalPoolSize: participants.length,
    uniqueParticipants: participants.length,
    winners: winners.map(w => ({
      userId: w.userId,
      wonAt: new Date().toISOString(),
    })),
    method: "random-fisher-yates",
  };
}

// ─────────────────────────────────────────────
//  SELECT WINNERS
//  - Fetches only existing (non-deleted) users
//  - Completely random — every participant has
//    an equal chance regardless of XP
//  - Fisher-Yates shuffle
//  - NO duplicate winners
// ─────────────────────────────────────────────
async function selectWinners(participants, maxWinners) {
  // 1. Only keep participants whose accounts still exist
  const userIds = participants.map(p => p.userId);
  const existingUsers = await User.find({
    _id: { $in: userIds },
  }).select("_id emri mbiemri email avatarStyle");

  const existingMap = new Map(existingUsers.map(u => [u._id.toString(), u]));

  // Filter out deleted accounts
  const activeParticipants = participants.filter(p =>
    existingMap.has(p.userId.toString())
  );

  // 2. If ALL accounts were deleted, return empty — no ghost winners
  if (activeParticipants.length === 0) {
    return { winners: [], auditLog: null };
  }

  // 3. Shuffle with Fisher-Yates (fully random, no weighting)
  const shuffled = fisherYatesShuffle(activeParticipants);

  // 4. Pick winners — deduplicate (one win per user)
  const seenUserIds = new Set();
  const winners = [];

  for (const p of shuffled) {
    const uid = p.userId.toString();
    if (seenUserIds.has(uid)) continue; // skip duplicate
    seenUserIds.add(uid);

    const user = existingMap.get(uid);
    winners.push({
      userId: p.userId,
      emri: user?.emri || p.emri,
      mbiemri: user?.mbiemri || p.mbiemri,
      email: user?.email || p.email,
      avatarStyle: user?.avatarStyle || p.avatarStyle || "adventurer",
    });

    if (winners.length >= maxWinners) break;
  }

  // 5. Build audit log
  const auditLog = buildAuditLog(activeParticipants, winners);

  return { winners, auditLog };
}

// ─────────────────────────────────────────────
//  INTERNAL: end a single giveaway safely
// ─────────────────────────────────────────────
async function endGiveaway(giveaway) {
  giveaway.status = "ended";

  if (giveaway.participants.length === 0) {
    // No participants — mark as ended with no winners, log it
    giveaway.auditLog = {
      drawnAt: new Date().toISOString(),
      totalPoolSize: 0,
      uniqueParticipants: 0,
      winners: [],
      method: "no-participants",
      note: "Giveaway ended with zero participants. No winners selected.",
    };
    giveaway.winners = [];
  } else if (giveaway.winners.length === 0) {
    const { winners, auditLog } = await selectWinners(
      giveaway.participants,
      giveaway.maxWinners
    );
    giveaway.winners = winners;
    giveaway.auditLog = auditLog;
  }

  await giveaway.save();
}

// ─────────────────────────────────────────────
//  CRON JOB — runs every minute
//  Automatically ends expired active giveaways
//  No HTTP request needed to trigger this
// ─────────────────────────────────────────────
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredGiveaways = await Giveaway.find({
      status: "active",
      endTime: { $lte: now },
    });

    for (const giveaway of expiredGiveaways) {
      console.log(`[CRON] Ending giveaway: ${giveaway._id} — "${giveaway.title}"`);
      await endGiveaway(giveaway);
    }

    if (expiredGiveaways.length > 0) {
      console.log(`[CRON] Ended ${expiredGiveaways.length} giveaway(s) at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[CRON] Error ending giveaways:", err.message);
  }
});

// ─────────────────────────────────────────────
//  GET all giveaways
// ─────────────────────────────────────────────
exports.getAllGiveaways = async (req, res) => {
  try {
    const giveaways = await Giveaway.find().sort({ createdAt: -1 });
    res.json({ success: true, data: giveaways });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  GET single giveaway
// ─────────────────────────────────────────────
exports.getGiveawayById = async (req, res) => {
  try {
    const giveaway = await Giveaway.findById(req.params.id);
    if (!giveaway)
      return res.status(404).json({ success: false, message: "Giveaway not found" });

    res.json({ success: true, data: giveaway });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  POST create giveaway (admin only)
// ─────────────────────────────────────────────
exports.createGiveaway = async (req, res) => {
  try {
    const { title, description, imageUrl, endTime, maxWinners, maxParticipants } = req.body;

    if (maxWinners && maxParticipants && maxWinners > maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "maxWinners cannot exceed maxParticipants",
      });
    }

    const giveaway = await Giveaway.create({
      title,
      description,
      imageUrl,
      endTime: new Date(endTime),
      maxWinners,
      maxParticipants: maxParticipants || null, // null = unlimited
    });

    res.status(201).json({ success: true, data: giveaway });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  PUT update giveaway (admin only)
// ─────────────────────────────────────────────
exports.updateGiveaway = async (req, res) => {
  try {
    const giveaway = await Giveaway.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!giveaway)
      return res.status(404).json({ success: false, message: "Giveaway not found" });
    res.json({ success: true, data: giveaway });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  DELETE giveaway (admin only)
// ─────────────────────────────────────────────
exports.deleteGiveaway = async (req, res) => {
  try {
    await Giveaway.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Giveaway deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  POST enter giveaway
// ─────────────────────────────────────────────
exports.enterGiveaway = async (req, res) => {
  try {
    const giveaway = await Giveaway.findById(req.params.id);
    if (!giveaway)
      return res.status(404).json({ success: false, message: "Giveaway not found" });
    if (giveaway.status !== "active")
      return res.status(400).json({ success: false, message: "Giveaway is not active" });
    if (new Date(giveaway.endTime) <= new Date())
      return res.status(400).json({ success: false, message: "Giveaway has ended" });

    // Max participants cap check
    if (
      giveaway.maxParticipants !== null &&
      giveaway.maxParticipants !== undefined &&
      giveaway.participants.length >= giveaway.maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: `This giveaway is full (max ${giveaway.maxParticipants} participants)`,
      });
    }

    // Duplicate entry check
    const alreadyEntered = giveaway.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );
    if (alreadyEntered)
      return res.status(400).json({ success: false, message: "Already entered" });

    giveaway.participants.push({
      userId: req.user._id,
      emri: req.user.emri,
      mbiemri: req.user.mbiemri,
      email: req.user.email,
      avatarStyle: req.user.avatarStyle || "adventurer",
    });

    await giveaway.save();
    res.json({ success: true, message: "Entered successfully", data: giveaway });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  POST pick winners manually (admin)
// ─────────────────────────────────────────────
exports.pickWinners = async (req, res) => {
  try {
    const giveaway = await Giveaway.findById(req.params.id);
    if (!giveaway)
      return res.status(404).json({ success: false, message: "Giveaway not found" });

    // 0 participants — return clear message, don't crash
    if (giveaway.participants.length === 0) {
      giveaway.status = "ended";
      giveaway.winners = [];
      giveaway.auditLog = {
        drawnAt: new Date().toISOString(),
        totalPoolSize: 0,
        uniqueParticipants: 0,
        winners: [],
        method: "no-participants",
        note: "Manually ended with zero participants.",
      };
      await giveaway.save();
      return res.status(200).json({
        success: true,
        message: "Giveaway ended with no participants. No winners selected.",
        data: giveaway,
      });
    }

    const { winners, auditLog } = await selectWinners(
      giveaway.participants,
      giveaway.maxWinners
    );

    giveaway.winners = winners;
    giveaway.auditLog = auditLog;
    giveaway.status = "ended";
    await giveaway.save();

    res.json({ success: true, data: giveaway });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
//  GET audit log for a giveaway (admin)
// ─────────────────────────────────────────────
exports.getAuditLog = async (req, res) => {
  try {
    const giveaway = await Giveaway.findById(req.params.id).select(
      "title auditLog winners status"
    );
    if (!giveaway)
      return res.status(404).json({ success: false, message: "Giveaway not found" });
    if (!giveaway.auditLog)
      return res.status(404).json({ success: false, message: "No audit log yet — giveaway may still be active" });

    res.json({ success: true, data: giveaway.auditLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};