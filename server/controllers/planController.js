const Plan = require("../models/Plan") // Use the original Plan model
const User = require("../models/User")

const getDefaultA1Topics = () => [
  { title: "Alphabet and Pronunciation", description: "Learn the German alphabet and basic pronunciation rules." },
  { title: "Numbers (0-100)", description: "Master counting from zero to one hundred." },
  { title: "Basic Greetings and Introductions", description: "Learn how to greet people and introduce yourself." },
  { title: "Personal Pronouns", description: "Understand 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sie/Sie'." },
  { title: "Verbs: 'sein' and 'haben'", description: "Conjugate and use the verbs 'to be' and 'to have'." },
  {
    title: "Nouns and Articles (Nominative)",
    description: "Learn common nouns and their definite/indefinite articles in the nominative case.",
  },
  {
    title: "Simple Questions (W-Fragen)",
    description: "Formulate basic questions using 'wer', 'was', 'wo', 'wann', 'wie'.",
  },
  { title: "Daily Routines and Time", description: "Talk about daily activities and tell time." },
  { title: "Food and Drinks", description: "Vocabulary for common food and beverages." },
  { title: "Family and Friends", description: "Vocabulary for family members and friends." },
  { title: "Colors and Adjectives", description: "Learn basic colors and simple adjectives." },
  { title: "Prepositions (basic)", description: "Understand simple prepositions like 'in', 'auf', 'unter'." },
  { title: "Shopping and Prices", description: "Phrases for shopping and asking about prices." },
  { title: "Directions and Places", description: "Asking for and giving directions, common places." },
  { title: "Hobbies and Free Time", description: "Talking about leisure activities." },
]

// Placeholder for other levels - you can expand this later
const getDefaultTopicsForLevel = (level) => {
  switch (level) {
    case "A1":
      return getDefaultA1Topics()
    // case "A2": return getDefaultA2Topics(); // Add A2 topics here
    // case "B1": return getDefaultB1Topics(); // Add B1 topics here
    // ... and so on for B2, C1, C2
    default:
      return [] // Return empty array or throw error for unsupported levels
  }
}

exports.createPlan = async (req, res) => {
  const { level, topics } = req.body
  const userId = req.user._id

  try {
    let plan = await Plan.findOne({ userId, level })

    if (plan) return res.status(400).json({ message: "Plan for this user and level already exists." })

    const planTopics = topics && topics.length > 0 ? topics : getDefaultTopicsForLevel(level)

    plan = await Plan.create({
      userId,
      level,
      topics: planTopics,
    })

    res.status(201).json({
      success: true,
      data: plan,
      message: "Learning plan created successfully.",
    })
  } catch (error) {
    console.error("Error creating plan:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.getPlanByLevel = async (req, res) => {
  const { level } = req.params
  const userId = req.user._id

  console.log(`getPlanByLevel controller called for user ${userId} and level ${level}`)

  try {
    const plan = await Plan.findOne({ userId, level }).populate("userId", "emri mbiemri xp")

    if (!plan) {
      console.log(
        `No plan found for user ${userId} and level ${level}. Attempting to create default A1 plan if level is A1.`,
      )
      if (level === "A1") {
        const defaultTopics = getDefaultTopicsForLevel("A1")
        const newPlan = await Plan.create({
          userId,
          level: "A1",
          topics: defaultTopics,
        })
        return res.status(200).json({
          success: true,
          data: newPlan,
          message: "Default A1 plan created and retrieved.",
        })
      }
      return res.status(404).json({ message: "Learning plan not found for this level." })
    }

    res.status(200).json({
      success: true,
      data: plan,
      message: "Learning plan retrieved successfully.",
    })
  } catch (error) {
    console.error("Error getting plan:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

exports.markTopicAsCompleted = async (req, res) => {
  const { planId, topicId } = req.params // Reverted to planId
  const userId = req.user._id
  const XP_PER_TOPIC = 100

  try {
    const plan = await Plan.findOne({ _id: planId, userId }) // Find by planId and userId

    if (!plan) return res.status(404).json({ message: "Learning plan not found or unauthorized." })

    const topic = plan.topics.id(topicId)

    if (!topic) return res.status(404).json({ message: "Topic not found in this plan." })

    if (topic.isCompleted) return res.status(400).json({ message: "Topic is already completed." })

    topic.isCompleted = true
    topic.xpAwarded = XP_PER_TOPIC
    topic.completedAt = new Date()

    await plan.save()

    const user = await User.findById(userId)
    if (user) {
      user.xp = (user.xp || 0) + XP_PER_TOPIC
      await user.save()
    }

    res.status(200).json({
      success: true,
      data: { plan, userXp: user ? user.xp : null }, // Return the updated plan and user XP
      message: `Topic marked as completed. ${XP_PER_TOPIC} XP awarded!`,
    })
  } catch (error) {
    console.error("Error marking topic as completed:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
