// ttsRoutes.js
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech"); // <-- vetëm një herë

dotenv.config();

// Initialize Google Cloud TTS client using JSON nga environment variable
let client;
try {
  client = new textToSpeech.TextToSpeechClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  });
  console.log("[TTS] Google Cloud TTS client initialized successfully");
} catch (error) {
  console.error("[TTS] Failed to initialize Google Cloud TTS client:", error);
}

// Controller për gjenerimin e TTS
const generateTTS = async (req, res) => {
  try {
    const { text, lang = "de-DE", gender = "MALE" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!client) {
      return res.status(500).json({
        error: "TTS service not available. Check server configuration.",
      });
    }

    const request = {
      input: { text },
      voice: {
        languageCode: lang,
        ssmlGender: gender,
        name: "de-DE-Wavenet-B",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.8,
        pitch: 0.0,
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }

    // Headers për streaming audio
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": response.audioContent.length,
      "Cache-Control": "public, max-age=3600",
    });

    res.send(Buffer.from(response.audioContent));
  } catch (error) {
    console.error("[TTS] Error generating audio:", error);
    res.status(500).json({
      error: "Failed to generate audio",
      message: error.message,
    });
  }
};

module.exports = { generateTTS };
