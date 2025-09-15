import React, { useState, useEffect } from "react";
import { pronunciationService } from "../services/api";
import { Play, Mic } from "lucide-react";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

const Pronunciation = () => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spoken, setSpoken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("A1");

  // Fetch words from API
  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      try {
        const res = await pronunciationService.getWords({ level: selectedLevel });
        setWords(res.data || []);
      } catch (err) {
        console.error(err);
        setWords([]);
      } finally {
        setLoading(false);
        setCurrentIndex(0);
        setMessage("");
        setSpoken("");
      }
    };
    fetchWords();
  }, [selectedLevel]);

  if (loading) return <p className="text-center mt-8">Loading words...</p>;
  if (!words.length) return <p className="text-center mt-8">Nuk ka fjalë për këtë nivel.</p>;

  const currentWord = words[currentIndex];

  // 🔊 Speak
  const speakWord = () => {
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "de-DE";
    speechSynthesis.speak(utterance);
  };

  // 🎤 Listen
  const listenWord = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async (event) => {
      const spokenWord = event.results[0][0].transcript;
      setSpoken(spokenWord);

      try {
        const res = await pronunciationService.checkPronunciation(currentWord._id, spokenWord);
        if (res.data.correct) {
          setMessage(`✅ Saktë! Fitove ${res.data.xpAdded} XP. Total XP: ${res.data.userXp}`);
        } else {
          setMessage(`❌ Gabim. Ti thatë: "${spokenWord}"`);
        }
      } catch (err) {
        console.error(err);
        setMessage("Gabim gjatë kontrollimit të shqiptimit");
      }
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
      setMessage("Gabim gjatë regjistrimit të zërit");
    };
  };

  // ➡ Next word
  const nextWord = () => {
    setMessage("");
    setSpoken("");
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const progress = Math.round(((currentIndex + 1) / words.length) * 100);

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Shqipto fjalën</h2>

      {/* Level Selection */}
      <div className="flex flex-wrap justify-center mb-4 gap-2">
        {levels.map((level) => (
          <label key={level} className="flex items-center gap-1">
            <input
              type="radio"
              name="level"
              value={level}
              checked={selectedLevel === level}
              onChange={() => setSelectedLevel(level)}
              className="accent-blue-500"
            />
            {level}
          </label>
        ))}
      </div>

      <p className="text-2xl font-semibold mb-2 text-center">{currentWord.word}</p>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Përkthimi: {currentWord.translation} | Level: {currentWord.level}
      </p>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={speakWord}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          <Play size={18} /> Dëgjo
        </button>
        <button
          onClick={listenWord}
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          <Mic size={18} /> Shqipto
        </button>
      </div>

      <p className="text-center">Ju thatë: <b>{spoken}</b></p>
      <p className="text-center mt-2 font-semibold">{message}</p>

      <div className="mt-4 w-full bg-gray-200 rounded h-4">
        <div
          className="bg-blue-500 h-4 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-center">{currentIndex + 1} / {words.length}</p>

      <button
        onClick={nextWord}
        className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
      >
        ➡ Fjala tjetër
      </button>
    </div>
  );
};

export default Pronunciation;
