// ttsRoutes.js
const express = require("express");
const textToSpeech = require("@google-cloud/text-to-speech");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// Initialize Google Cloud TTS client with explicit credentials
let client;
try {
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.cwd(), "gjuhagjermaneTTS.json");

  console.log("[TTS] Initializing Google Cloud TTS client...");
  console.log("[TTS] Credentials path:", credentialsPath);

  client = new textToSpeech.TextToSpeechClient({
    keyFilename: credentialsPath,
  });

  console.log("[TTS] Google Cloud TTS client initialized successfully");
} catch (error) {
  console.error("[TTS] Failed to initialize Google Cloud TTS client:", error);
}

// Generate TTS endpoint
const generateTTS = async (req, res) => {
  try {
    const { text, lang = "de-DE", gender = "FEMALE" } = req.body;

    console.log("[TTS] Request received:", {
      textLength: text?.length,
      lang,
      gender,
    });

    if (!text) {
      console.error("[TTS] No text provided");
      return res.status(400).json({ error: "Text is required" });
    }

    if (!client) {
      console.error("[TTS] Google Cloud TTS client not initialized");
      return res.status(500).json({
        error: "TTS service not available. Check server configuration.",
      });
    }

    // Prepare the request for Google Cloud TTS
const request = {
  input: { text },
  voice: {
    languageCode: "de-DE", // Gjermanisht
    ssmlGender: "MALE",    // Mashkullor
    name: "de-DE-Wavenet-B" // ✅ Zëri WaveNet mashkullor gjerman
  },
  audioConfig: {
    audioEncoding: "MP3",
    speakingRate: 0.8,
    pitch: 0.0,
  },
};



    console.log("[TTS] Calling Google Cloud TTS API...");
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      console.error("[TTS] No audio content in response");
      return res.status(500).json({ error: "Failed to generate audio" });
    }

    console.log(
      "[TTS] Audio generated successfully, size:",
      response.audioContent.length,
      "bytes"
    );

    // Set appropriate headers for audio streaming
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": response.audioContent.length,
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    });

    // Send the audio content as binary
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
