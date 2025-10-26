// models/TTS.js
const googleTTS = require('google-tts-api');

function getTTSUrl(text, lang = 'de') {
  return googleTTS.getAudioUrl(text, {
    lang,
    slow: false,
    host: 'https://translate.google.com',
  });
}

module.exports = getTTSUrl;
