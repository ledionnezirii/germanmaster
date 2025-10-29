// ttsTest.js
const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

// Vendos path-in e credential JSON
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "gjuhagjermaneTTS.json");

// Krijo client
const client = new textToSpeech.TextToSpeechClient();

// Merr tekstin nga komand line
const text = process.argv.slice(2).join(" "); // node ttsTest.js "teksti yt"
if (!text) {
  console.error("Ju lutem jepni tekstin si argument!");
  process.exit(1);
}

async function main() {
  try {
    const request = {
      input: { text },
      voice: { languageCode: "de-DE", ssmlGender: "MALE" }, // ⬅️ Zë mashkullor
      audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await client.synthesizeSpeech(request);

    // Ruaj audio në file
    const outputFile = path.join(__dirname, "output_male.mp3");
    fs.writeFileSync(outputFile, response.audioContent, "binary");
    console.log("✅ Audio mashkullor u ruajt:", outputFile);
  } catch (err) {
    console.error("❌ Gabim:", err);
  }
}

main();
