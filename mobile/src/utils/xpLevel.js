const XP_THRESHOLDS = [0, 50, 200, 500, 1000, 1500, 2000, 2700, 3500, 4500, 5500, 6200, 7000, 7800];

// Extend beyond level 14 with always-increasing steps
(function () {
  let step = 900;
  let last = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  for (let i = XP_THRESHOLDS.length; i < 100; i++) {
    last += step;
    XP_THRESHOLDS.push(last);
    step += 100;
  }
})();

export function computeXpLevel(totalXp) {
  const xp = Math.max(0, totalXp || 0);
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const levelStartXp     = XP_THRESHOLDS[level - 1] ?? 0;
  const levelEndXp       = XP_THRESHOLDS[level] ?? (levelStartXp + 1000);
  const xpInCurrentLevel = xp - levelStartXp;
  const xpForNextLevel   = levelEndXp - xp;
  const progress         = levelEndXp > levelStartXp ? xpInCurrentLevel / (levelEndXp - levelStartXp) : 0;
  return { xpLevel: level, xpInCurrentLevel, xpForNextLevel, levelStartXp, levelEndXp, progress };
}
