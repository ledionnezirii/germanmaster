const User = require("../models/User")
const Achievement = require("../models/Achievements")

// Comprehensive achievement milestones
const achievementsSeed = [
  {
    key: "xp_100",
    title: "Fillimi i Udhëtimit",
    description: "Fitoni 100 XP për të filluar aventurën tuaj.",
    xpThreshold: 100,
    iconUrl: "/icons/achievements/xp_100.png",
    category: "xp",
  },
  {
    key: "xp_300",
    title: "Nxënës i Zellshëm",
    description: "Arrini 300 XP, vazhdoni kështu!",
    xpThreshold: 300,
    iconUrl: "/icons/achievements/xp_300.png",
    category: "xp",
  },
  {
    key: "xp_500",
    title: "Yll në Rritje",
    description: "500 XP të fituara, punë e shkëlqyer!",
    xpThreshold: 500,
    iconUrl: "/icons/achievements/xp_500.png",
    category: "xp",
  },
  {
    key: "xp_700",
    title: "Mësues i Përkushtuar",
    description: "700 XP të arritura, vazhdoni të mësoni!",
    xpThreshold: 700,
    iconUrl: "/icons/achievements/xp_700.png",
    category: "xp",
  },
  {
    key: "xp_900",
    title: "Fillim i Fortë",
    description: "900 XP tregon përkushtimin tuaj!",
    xpThreshold: 900,
    iconUrl: "/icons/achievements/xp_900.png",
    category: "xp",
  },
  {
    key: "xp_1100",
    title: "Eksploruesi",
    description: "1100 XP hap horizonte të reja.",
    xpThreshold: 1100,
    iconUrl: "/icons/achievements/xp_1100.png",
    category: "xp",
  },
  {
    key: "xp_1300",
    title: "Eksperti",
    description: "1300 XP vërteton ekspertizën tuaj.",
    xpThreshold: 1300,
    iconUrl: "/icons/achievements/xp_1300.png",
    category: "xp",
  },
  {
    key: "xp_1500",
    title: "Mjeshtri",
    description: "1500 XP të fituara, mbresëlënëse!",
    xpThreshold: 1500,
    iconUrl: "/icons/achievements/xp_1500.png",
    category: "xp",
  },
  {
    key: "xp_1700",
    title: "Arritësi",
    description: "1700 XP do të thotë që po arrini gjëra të mëdha.",
    xpThreshold: 1700,
    iconUrl: "/icons/achievements/xp_1700.png",
    category: "xp",
  },
  {
    key: "xp_1900",
    title: "Kampioni",
    description: "1900 XP, jeni një kampion i vërtetë.",
    xpThreshold: 1900,
    iconUrl: "/icons/achievements/xp_1900.png",
    category: "xp",
  },
  {
    key: "xp_2100",
    title: "Legjenda",
    description: "2100 XP shkyç statusin legjendë.",
    xpThreshold: 2100,
    iconUrl: "/icons/achievements/xp_2100.png",
    category: "xp",
  },
  {
    key: "xp_2300",
    title: "Heroi",
    description: "2300 XP, një hero i vërtetë në formim!",
    xpThreshold: 2300,
    iconUrl: "/icons/achievements/xp_2300.png",
    category: "xp",
  },
  {
    key: "xp_2500",
    title: "Elita",
    description: "2500 XP, lojtar elite i njohur.",
    xpThreshold: 2500,
    iconUrl: "/icons/achievements/xp_2500.png",
    category: "xp",
  },
  {
    key: "xp_2700",
    title: "Mendjemprehtësi",
    description: "2700 XP, keni aftësi të shkëlqyera strategjike.",
    xpThreshold: 2700,
    iconUrl: "/icons/achievements/xp_2700.png",
    category: "xp",
  },
  {
    key: "xp_2900",
    title: "Mjeshtër i Madh",
    description: "2900 XP do të thotë që po afroheni në statusin e mjeshtrit të madh.",
    xpThreshold: 2900,
    iconUrl: "/icons/achievements/xp_2900.png",
    category: "xp",
  },
  {
    key: "xp_3000",
    title: "Përfundimtari",
    description: "3000 XP, arritja përfundimtare!",
    xpThreshold: 3000,
    iconUrl: "/icons/achievements/xp_3000.png",
    category: "xp",
  },
  {
    key: "xp_3500",
    title: "Mbinatyrore",
    description: "3500 XP, keni kaluar të gjitha pritshmëritë!",
    xpThreshold: 3500,
    iconUrl: "/icons/achievements/xp_3500.png",
    category: "xp",
  },
  {
    key: "xp_4000",
    title: "Gjigandi",
    description: "4000 XP, jeni një gjigant i të mësuarit!",
    xpThreshold: 4000,
    iconUrl: "/icons/achievements/xp_4000.png",
    category: "xp",
  },
  {
    key: "xp_5000",
    title: "Perëndia e Gjuhës",
    description: "5000 XP, keni arritur nivelin e perëndive!",
    xpThreshold: 5000,
    iconUrl: "/icons/achievements/xp_5000.png",
    category: "xp",
  },
  // Streak-based achievements
  {
    key: "streak_3",
    title: "Fillimi i Serisë",
    description: "Mësoni 3 ditë rresht.",
    xpThreshold: 0,
    streakThreshold: 3,
    iconUrl: "/icons/achievements/streak_3.png",
    category: "streak",
  },
  {
    key: "streak_7",
    title: "Javë e Përkushtuar",
    description: "Mësoni 7 ditë rresht.",
    xpThreshold: 0,
    streakThreshold: 7,
    iconUrl: "/icons/achievements/streak_7.png",
    category: "streak",
  },
  {
    key: "streak_14",
    title: "Dy Javë të Forta",
    description: "Mësoni 14 ditë rresht.",
    xpThreshold: 0,
    streakThreshold: 14,
    iconUrl: "/icons/achievements/streak_14.png",
    category: "streak",
  },
  {
    key: "streak_30",
    title: "Muaj i Përsosur",
    description: "Mësoni 30 ditë rresht.",
    xpThreshold: 0,
    streakThreshold: 30,
    iconUrl: "/icons/achievements/streak_30.png",
    category: "streak",
  },
  {
    key: "streak_60",
    title: "Dy Muaj Rresht",
    description: "Mësoni 60 ditë rresht.",
    xpThreshold: 0,
    streakThreshold: 60,
    iconUrl: "/icons/achievements/streak_60.png",
    category: "streak",
  },
  {
    key: "streak_100",
    title: "Qindra Ditë",
    description: "Mësoni 100 ditë rresht.",
    xpThreshold: 0,
    streakThreshold: 100,
    iconUrl: "/icons/achievements/streak_100.png",
    category: "streak",
  },
  // Test-based achievements
  {
    key: "tests_5",
    title: "Fillimi i Testeve",
    description: "Përfundoni 5 teste.",
    xpThreshold: 0,
    testsThreshold: 5,
    iconUrl: "/icons/achievements/tests_5.png",
    category: "tests",
  },
  {
    key: "tests_10",
    title: "Testues i Zellshëm",
    description: "Përfundoni 10 teste.",
    xpThreshold: 0,
    testsThreshold: 10,
    iconUrl: "/icons/achievements/tests_10.png",
    category: "tests",
  },
  {
    key: "tests_25",
    title: "Mjeshtër Testesh",
    description: "Përfundoni 25 teste.",
    xpThreshold: 0,
    testsThreshold: 25,
    iconUrl: "/icons/achievements/tests_25.png",
    category: "tests",
  },
  {
    key: "tests_50",
    title: "Ekspert Testesh",
    description: "Përfundoni 50 teste.",
    xpThreshold: 0,
    testsThreshold: 50,
    iconUrl: "/icons/achievements/tests_50.png",
    category: "tests",
  },
  {
    key: "tests_100",
    title: "Legjendë Testesh",
    description: "Përfundoni 100 teste.",
    xpThreshold: 0,
    testsThreshold: 100,
    iconUrl: "/icons/achievements/tests_100.png",
    category: "tests",
  },
]

/**
 * Update user's XP and check for newly unlocked achievements
 */
const updateUserXP = async (req, res) => {
  try {
    const userId = req.params.userId
    const { xpGained } = req.body

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID e përdoruesit mungon",
      })
    }

    const gainedXP = Number(xpGained) || 0
    if (gainedXP <= 0) {
      return res.status(400).json({
        success: false,
        message: "Vlera e XP duhet të jetë pozitive",
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Përdoruesi nuk u gjet",
      })
    }

    // Calculate new XP
    const currentXP = Number(user.xp) || 0
    const newXP = currentXP + gainedXP
    user.xp = newXP

    // Initialize achievements array if it doesn't exist
    if (!user.achievements) {
      user.achievements = []
    }

    // Check for newly unlocked achievements
    const newlyUnlockedAchievements = []
    const achievementDetails = []

    for (const achievement of achievementsSeed) {
      // Skip if already unlocked
      if (user.achievements.includes(achievement.key)) {
        continue
      }

      let shouldUnlock = false

      // Check XP-based achievements
      if (achievement.category === "xp" && newXP >= achievement.xpThreshold) {
        shouldUnlock = true
      }

      // Check streak-based achievements
      if (achievement.category === "streak" && user.streakCount >= achievement.streakThreshold) {
        shouldUnlock = true
      }

      // Check test-based achievements
      if (achievement.category === "tests" && user.completedTests >= achievement.testsThreshold) {
        shouldUnlock = true
      }

      if (shouldUnlock) {
        user.achievements.push(achievement.key)
        newlyUnlockedAchievements.push(achievement.key)
        achievementDetails.push({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
          category: achievement.category,
        })

        // Store in database for persistence
        await Achievement.findOneAndUpdate(
          { key: achievement.key },
          {
            key: achievement.key,
            title: achievement.title,
            description: achievement.description,
            xpThreshold: achievement.xpThreshold,
            iconUrl: achievement.iconUrl,
          },
          { upsert: true, new: true },
        )
      }
    }

    // Save user with new XP and achievements
    await user.save()

    // Calculate progress to next achievement
    const nextAchievement = achievementsSeed
      .filter((ach) => ach.category === "xp" && ach.xpThreshold > newXP)
      .sort((a, b) => a.xpThreshold - b.xpThreshold)[0]

    const progressToNext = nextAchievement
      ? {
          nextAchievement: {
            key: nextAchievement.key,
            title: nextAchievement.title,
            xpThreshold: nextAchievement.xpThreshold,
          },
          currentXP: newXP,
          xpNeeded: nextAchievement.xpThreshold - newXP,
          progressPercentage: Math.min(100, (newXP / nextAchievement.xpThreshold) * 100),
        }
      : null

    res.status(200).json({
      success: true,
      message:
        newlyUnlockedAchievements.length > 0
          ? `XP u përditësua dhe ${newlyUnlockedAchievements.length} arritje të reja u shkyçën!`
          : "XP u përditësua me sukses",
      data: {
        previousXP: currentXP,
        xpGained: gainedXP,
        newXP: newXP,
        newlyUnlockedAchievements: achievementDetails,
        totalAchievements: user.achievements.length,
        progressToNext,
      },
    })
  } catch (error) {
    console.error("Gabim në përditësimin e XP:", error)
    res.status(500).json({
      success: false,
      message: "Gabim i brendshëm i serverit",
      error: error.message,
    })
  }
}

/**
 * Get all achievements for a user (both locked and unlocked)
 */
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.params.userId

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID e përdoruesit mungon",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Përdoruesi nuk u gjet",
      })
    }

    const userAchievementKeys = user.achievements || []
    const userXP = user.xp || 0
    const userStreak = user.streakCount || 0
    const userTests = user.completedTests || 0

    // Map all achievements with locked/unlocked status
    const allAchievements = achievementsSeed.map((achievement) => {
      const isUnlocked = userAchievementKeys.includes(achievement.key)

      let progress = 0
      let progressText = ""

      if (!isUnlocked) {
        if (achievement.category === "xp") {
          progress = Math.min(100, (userXP / achievement.xpThreshold) * 100)
          progressText = `${userXP} / ${achievement.xpThreshold} XP`
        } else if (achievement.category === "streak") {
          progress = Math.min(100, (userStreak / achievement.streakThreshold) * 100)
          progressText = `${userStreak} / ${achievement.streakThreshold} ditë`
        } else if (achievement.category === "tests") {
          progress = Math.min(100, (userTests / achievement.testsThreshold) * 100)
          progressText = `${userTests} / ${achievement.testsThreshold} teste`
        }
      }

      return {
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        category: achievement.category,
        xpThreshold: achievement.xpThreshold,
        streakThreshold: achievement.streakThreshold,
        testsThreshold: achievement.testsThreshold,
        isUnlocked,
        progress: Math.round(progress),
        progressText,
        unlockedAt: isUnlocked ? user.updatedAt : null,
      }
    })

    // Group achievements by category
    const groupedAchievements = {
      xp: allAchievements.filter((a) => a.category === "xp"),
      streak: allAchievements.filter((a) => a.category === "streak"),
      tests: allAchievements.filter((a) => a.category === "tests"),
    }

    // Calculate statistics
    const stats = {
      totalAchievements: achievementsSeed.length,
      unlockedAchievements: userAchievementKeys.length,
      lockedAchievements: achievementsSeed.length - userAchievementKeys.length,
      completionPercentage: Math.round((userAchievementKeys.length / achievementsSeed.length) * 100),
      byCategory: {
        xp: {
          total: groupedAchievements.xp.length,
          unlocked: groupedAchievements.xp.filter((a) => a.isUnlocked).length,
        },
        streak: {
          total: groupedAchievements.streak.length,
          unlocked: groupedAchievements.streak.filter((a) => a.isUnlocked).length,
        },
        tests: {
          total: groupedAchievements.tests.length,
          unlocked: groupedAchievements.tests.filter((a) => a.isUnlocked).length,
        },
      },
    }

    // Find next achievement to unlock in each category
    const nextAchievements = {
      xp: groupedAchievements.xp.find((a) => !a.isUnlocked),
      streak: groupedAchievements.streak.find((a) => !a.isUnlocked),
      tests: groupedAchievements.tests.find((a) => !a.isUnlocked),
    }

    res.status(200).json({
      success: true,
      data: {
        allAchievements,
        groupedAchievements,
        stats,
        nextAchievements,
        userProgress: {
          xp: userXP,
          streak: userStreak,
          completedTests: userTests,
        },
      },
    })
  } catch (error) {
    console.error("Gabim në marrjen e arritjeve:", error)
    res.status(500).json({
      success: false,
      message: "Gabim i brendshëm i serverit",
      error: error.message,
    })
  }
}

/**
 * Check and update streak-based achievements
 */
const checkStreakAchievements = async (req, res) => {
  try {
    const userId = req.params.userId

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID e përdoruesit mungon",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Përdoruesi nuk u gjet",
      })
    }

    const userStreak = user.streakCount || 0
    const newlyUnlockedAchievements = []

    // Check streak achievements
    for (const achievement of achievementsSeed.filter((a) => a.category === "streak")) {
      if (!user.achievements.includes(achievement.key) && userStreak >= achievement.streakThreshold) {
        user.achievements.push(achievement.key)
        newlyUnlockedAchievements.push({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
        })
      }
    }

    if (newlyUnlockedAchievements.length > 0) {
      await user.save()
    }

    res.status(200).json({
      success: true,
      data: {
        newlyUnlockedAchievements,
        currentStreak: userStreak,
      },
    })
  } catch (error) {
    console.error("Gabim në kontrollin e arritjeve të serisë:", error)
    res.status(500).json({
      success: false,
      message: "Gabim i brendshëm i serverit",
      error: error.message,
    })
  }
}

/**
 * Check and update test-based achievements
 */
const checkTestAchievements = async (req, res) => {
  try {
    const userId = req.params.userId

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID e përdoruesit mungon",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Përdoruesi nuk u gjet",
      })
    }

    const userTests = user.completedTests || 0
    const newlyUnlockedAchievements = []

    // Check test achievements
    for (const achievement of achievementsSeed.filter((a) => a.category === "tests")) {
      if (!user.achievements.includes(achievement.key) && userTests >= achievement.testsThreshold) {
        user.achievements.push(achievement.key)
        newlyUnlockedAchievements.push({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
        })
      }
    }

    if (newlyUnlockedAchievements.length > 0) {
      await user.save()
    }

    res.status(200).json({
      success: true,
      data: {
        newlyUnlockedAchievements,
        completedTests: userTests,
      },
    })
  } catch (error) {
    console.error("Gabim në kontrollin e arritjeve të testeve:", error)
    res.status(500).json({
      success: false,
      message: "Gabim i brendshëm i serverit",
      error: error.message,
    })
  }
}

/**
 * Get achievement statistics for leaderboard
 */
const getAchievementLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10

    const topUsers = await User.find()
      .select("firstName lastName email xp achievements streakCount completedTests")
      .sort({ "achievements.length": -1, xp: -1 })
      .limit(limit)

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      xp: user.xp || 0,
      achievementsCount: user.achievements?.length || 0,
      streakCount: user.streakCount || 0,
      completedTests: user.completedTests || 0,
    }))

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        totalUsers: topUsers.length,
      },
    })
  } catch (error) {
    console.error("Gabim në marrjen e renditjes:", error)
    res.status(500).json({
      success: false,
      message: "Gabim i brendshëm i serverit",
      error: error.message,
    })
  }
}

module.exports = {
  updateUserXP,
  getUserAchievements,
  checkStreakAchievements,
  checkTestAchievements,
  getAchievementLeaderboard,
}
