const axios = require("axios")
const { Storage } = require("@google-cloud/storage")

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = "NE7AIW5DoJ7lUosXV2KR"

let storage;
try {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    console.log("[TTS] Initializing with GOOGLE_CREDENTIALS_JSON")
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    storage = new Storage({
      credentials: credentials,
      projectId: credentials.project_id
    })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // This should only be a file path, not JSON content
    console.log("[TTS] Initializing with GOOGLE_APPLICATION_CREDENTIALS file")
    storage = new Storage({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })
  } else {
    console.error("[TTS] ERROR: No Google credentials configured!")
    storage = new Storage() // Will try default credentials
  }
  console.log("[TTS] Storage initialized successfully")
} catch (error) {
  console.error("[TTS] Failed to initialize storage:", error.message)
  throw error
}


const bucketName = process.env.BUCKET_NAME
const bucket = storage.bucket(bucketName)

// Get audio file path based on type (listenTexts, dictionary, phrases, dialogues, categories)
const getAudioFilePath = (id, level, type = "listenTexts") => {
  return `${type}/${level || "A1"}/${id}.mp3`
}

const audioExists = async (id, level, type = "listenTexts") => {
  const filePath = getAudioFilePath(id, level, type)
  const file = bucket.file(filePath)
  try {
    const [exists] = await file.exists()
    return exists
  } catch (error) {
    console.error("[TTS] Error checking file existence:", error)
    return false
  }
}

const generateAudio = async (text, id, level, type = "listenTexts", voiceId = ELEVENLABS_VOICE_ID) => {
  try {
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      data: {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      responseType: "arraybuffer",
    })

    const filePath = getAudioFilePath(id, level, type)
    const file = bucket.file(filePath)

    await file.save(response.data, {
      metadata: {
        contentType: "audio/mpeg",
      },
    })

    console.log(`[TTS] Audio uploaded to GCS: ${filePath}`)
    return filePath
  } catch (error) {
    console.error("[TTS] ElevenLabs error:", error.response?.data || error.message)
    throw error
  }
}

const getSignedUrl = async (filePath) => {
  const file = bucket.file(filePath)
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  })
  return url
}

exports.getAudio = async (req, res) => {
  try {
    const { testId } = req.params
    const { text, level } = req.body

    if (!testId) {
      return res.status(400).json({ error: "Test ID is required" })
    }

    const filePath = getAudioFilePath(testId, level, "listenTexts")

    if (await audioExists(testId, level, "listenTexts")) {
      console.log(`[TTS] Serving cached audio from GCS: ${filePath}`)
      const url = await getSignedUrl(filePath)
      return res.json({ url })
    }

    if (!text) {
      return res.status(404).json({ error: "Audio not found and no text provided to generate" })
    }

    console.log(`[TTS] Generating new audio for test: ${testId}`)
    await generateAudio(text, testId, level, "listenTexts")

    const url = await getSignedUrl(filePath)
    return res.json({ url })
  } catch (error) {
    console.error("[TTS] Controller error:", error)
    return res.status(500).json({ error: "Failed to get/generate audio" })
  }
}

exports.getDictionaryAudio = async (req, res) => {
  try {
    const { wordId } = req.params
    const { text, level } = req.body

    if (!wordId) {
      return res.status(400).json({ error: "Word ID is required" })
    }

    const filePath = getAudioFilePath(wordId, level, "dictionary")

    if (await audioExists(wordId, level, "dictionary")) {
      console.log(`[TTS] Serving cached dictionary audio from GCS: ${filePath}`)
      const url = await getSignedUrl(filePath)
      return res.json({ url })
    }

    if (!text) {
      return res.status(404).json({ error: "Audio not found and no text provided to generate" })
    }

    console.log(`[TTS] Generating new dictionary audio for word: ${wordId}`)
    await generateAudio(text, wordId, level, "dictionary")

    const url = await getSignedUrl(filePath)
    return res.json({ url })
  } catch (error) {
    console.error("[TTS] Dictionary controller error:", error)
    return res.status(500).json({ error: "Failed to get/generate dictionary audio" })
  }
}

exports.getPhraseAudio = async (req, res) => {
  try {
    const { phraseId } = req.params
    const { text, level } = req.body

    if (!phraseId) {
      return res.status(400).json({ error: "Phrase ID is required" })
    }

    const filePath = getAudioFilePath(phraseId, level, "phrases")

    if (await audioExists(phraseId, level, "phrases")) {
      console.log(`[TTS] Serving cached phrase audio from GCS: ${filePath}`)
      const url = await getSignedUrl(filePath)
      return res.json({ url })
    }

    if (!text) {
      return res.status(404).json({ error: "Audio not found and no text provided to generate" })
    }

    console.log(`[TTS] Generating new phrase audio for: ${phraseId}`)
    await generateAudio(text, phraseId, level, "phrases")

    const url = await getSignedUrl(filePath)
    return res.json({ url })
  } catch (error) {
    console.error("[TTS] Phrase controller error:", error)
    return res.status(500).json({ error: "Failed to get/generate phrase audio" })
  }
}

exports.getDialogueAudio = async (req, res) => {
  try {
    const { dialogueId, lineIndex } = req.params
    const { text, level } = req.body

    if (!dialogueId) {
      return res.status(400).json({ error: "Dialogue ID is required" })
    }

    const audioId = `${dialogueId}_${lineIndex}`
    const filePath = getAudioFilePath(audioId, level, "dialogues")

    if (await audioExists(audioId, level, "dialogues")) {
      console.log(`[TTS] Serving cached dialogue audio from GCS: ${filePath}`)
      const url = await getSignedUrl(filePath)
      return res.json({ url })
    }

    if (!text) {
      return res.status(404).json({ error: "Audio not found and no text provided to generate" })
    }

    console.log(`[TTS] Generating new dialogue audio for: ${audioId}`)
    await generateAudio(text, audioId, level, "dialogues")

    const url = await getSignedUrl(filePath)
    return res.json({ url })
  } catch (error) {
    console.error("[TTS] Dialogue controller error:", error)
    return res.status(500).json({ error: "Failed to get/generate dialogue audio" })
  }
}

exports.getCategoryAudio = async (req, res) => {
  try {
    const { categoryId, wordIndex } = req.params
    const { text, level } = req.body

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" })
    }

    const audioId = `${categoryId}_${wordIndex}`
    const filePath = getAudioFilePath(audioId, level, "categories")

    if (await audioExists(audioId, level, "categories")) {
      console.log(`[TTS] Serving cached category audio from GCS: ${filePath}`)
      const url = await getSignedUrl(filePath)
      return res.json({ url })
    }

    if (!text) {
      return res.status(404).json({ error: "Audio not found and no text provided to generate" })
    }

    console.log(`[TTS] Generating new category audio for: ${audioId}`)
    await generateAudio(text, audioId, level, "categories")

    const url = await getSignedUrl(filePath)
    return res.json({ url })
  } catch (error) {
    console.error("[TTS] Category controller error:", error)
    return res.status(500).json({ error: "Failed to get/generate category audio" })
  }
}

exports.checkAudio = async (req, res) => {
  try {
    const { id } = req.params
    const { level, type } = req.query

    const exists = await audioExists(id, level || "A1", type || "listenTexts")
    return res.json({ exists, id, level, type })
  } catch (error) {
    console.error("[TTS] Check error:", error)
    return res.status(500).json({ error: "Failed to check audio" })
  }
}

exports.preGenerateAudio = async (req, res) => {
  try {
    const { id, text, level, type } = req.body

    if (!id || !text) {
      return res.status(400).json({ error: "ID and text are required" })
    }

    const audioType = type || "listenTexts"

    if (await audioExists(id, level, audioType)) {
      return res.json({ message: "Audio already exists", id, level, type: audioType })
    }

    await generateAudio(text, id, level, audioType)
    return res.json({ message: "Audio generated successfully", id, level, type: audioType })
  } catch (error) {
    console.error("[TTS] Pre-generate error:", error)
    return res.status(500).json({ error: "Failed to pre-generate audio" })
  }
}

exports.preGenerateDialogueAudio = async (req, res) => {
  try {
    const { dialogueId, dialogueLines, level } = req.body

    if (!dialogueId || !dialogueLines || !Array.isArray(dialogueLines)) {
      return res.status(400).json({ error: "Dialogue ID and lines array are required" })
    }

    const results = []

    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i]
      const audioId = `${dialogueId}_${i}`

      if (await audioExists(audioId, level, "dialogues")) {
        results.push({ index: i, status: "exists", audioId })
      } else {
        try {
          await generateAudio(line.text, audioId, level, "dialogues")
          results.push({ index: i, status: "generated", audioId })
        } catch (error) {
          results.push({ index: i, status: "error", audioId, error: error.message })
        }
      }
    }

    return res.json({
      message: "Dialogue audio processing complete",
      dialogueId,
      level,
      results,
    })
  } catch (error) {
    console.error("[TTS] Pre-generate dialogue error:", error)
    return res.status(500).json({ error: "Failed to pre-generate dialogue audio" })
  }
}

exports.preGenerateCategoryAudio = async (req, res) => {
  try {
    const { categoryId, words, level } = req.body

    if (!categoryId || !words || !Array.isArray(words)) {
      return res.status(400).json({ error: "Category ID and words array are required" })
    }

    const results = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const audioId = `${categoryId}_${i}`

      if (await audioExists(audioId, level, "categories")) {
        results.push({ index: i, status: "exists", audioId, word: word.word })
      } else {
        try {
          await generateAudio(word.word, audioId, level, "categories")
          results.push({ index: i, status: "generated", audioId, word: word.word })
        } catch (error) {
          results.push({ index: i, status: "error", audioId, word: word.word, error: error.message })
        }
      }
    }

    return res.json({
      message: "Category audio processing complete",
      categoryId,
      level,
      totalWords: words.length,
      results,
    })
  } catch (error) {
    console.error("[TTS] Pre-generate category error:", error)
    return res.status(500).json({ error: "Failed to pre-generate category audio" })
  }
}
