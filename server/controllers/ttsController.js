const getTTSUrl = require("../models/TTS")

exports.generateTTS = async (req, res) => {
  const { text, lang } = req.body

  console.log("[v0] TTS Request received:", { text, lang })

  // Validate input
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      error: "Text is required and must be a non-empty string",
    })
  }

  // Validate language code
  if (lang && typeof lang !== "string") {
    return res.status(400).json({
      error: "Language must be a valid string",
    })
  }

  // Check text length - allow up to 5000 characters
  if (text.length > 5000) {
    return res.status(400).json({
      error: "Text is too long. Maximum 5000 characters allowed.",
    })
  }

  try {
    const audioUrl = await getTTSUrl(text, lang || "de")
    console.log("[v0] TTS URL generated successfully:", audioUrl)

    // Return the audio URL in a consistent format
    res.json({
      success: true,
      audioUrl: Array.isArray(audioUrl) ? audioUrl : [audioUrl],
      text,
      lang: lang || "de",
      chunks: Array.isArray(audioUrl) ? audioUrl.length : 1,
    })
  } catch (error) {
    console.error("[v0] TTS Error:", error.message)
    console.error("[v0] TTS Error Stack:", error.stack)

    res.status(500).json({
      success: false,
      error: "Failed to generate TTS audio",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
