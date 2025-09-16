import React, { useState, useEffect } from "react";
import { pronunciationService } from "../services/api";
import { Play, Mic, CheckCircle } from "lucide-react";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

const Pronunciation = () => {
  const [packages, setPackages] = useState([]);
  const [completedPackages, setCompletedPackages] = useState([]); // ✅ finished
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [spoken, setSpoken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("A1");

  // Fetch packages and user completed info
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await pronunciationService.getWords({ level: selectedLevel });
        setPackages(res.data || []);

        // Extract completed packages if API returns this info
        if (res.data && res.data.completedPackageIds) {
          setCompletedPackages(res.data.completedPackageIds);
        }
      } catch (err) {
        console.error(err);
        setPackages([]);
      } finally {
        setLoading(false);
        setSelectedPackageIndex(null);
        setCurrentWordIndex(0);
        setMessage("");
        setSpoken("");
      }
    };
    fetchPackages();
  }, [selectedLevel]);

  if (loading) return <p className="text-center mt-8">Loading packages...</p>;
  if (!packages.length) return <p className="text-center mt-8">Nuk ka paketa për këtë nivel.</p>;

  const selectedPackage = selectedPackageIndex !== null ? packages[selectedPackageIndex] : null;
  const currentWord = selectedPackage ? selectedPackage.words[currentWordIndex] : null;

  // 🔊 Speak
  const speakWord = () => {
    if (!currentWord) return;
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "de-DE";
    speechSynthesis.speak(utterance);
  };

  // 🎤 Listen & Check
  const listenWord = () => {
    if (!currentWord) return;
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async (event) => {
      const spokenWord = event.results[0][0].transcript;
      setSpoken(spokenWord);

      try {
        const res = await pronunciationService.checkPronunciation(
          selectedPackage._id,
          currentWordIndex,
          spokenWord
        );

        if (res.data.correct) {
          setMessage(`✅ Saktë! Fitove ${res.data.xpAdded} XP. Total XP: ${res.data.userXp}`);

          // Mark package as completed if API returns completed
          if (res.data.completed && !completedPackages.includes(selectedPackage._id)) {
            setCompletedPackages((prev) => [...prev, selectedPackage._id]);
          }
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
    if (!selectedPackage) return;

    if (currentWordIndex + 1 < selectedPackage.words.length) {
      setCurrentWordIndex((prev) => prev + 1);
    } else {
      // Package completed
      if (!completedPackages.includes(selectedPackage._id)) {
        setCompletedPackages((prev) => [...prev, selectedPackage._id]);
      }
      setMessage(`🎉 Ke përfunduar paketën "${selectedPackage.title}"!`);
      setCurrentWordIndex(0);
      setSelectedPackageIndex(null);
    }
  };

  const totalWords = packages.reduce((acc, pkg) => acc + pkg.words.length, 0);
  const progress = selectedPackage
    ? Math.round(
        ((currentWordIndex +
          packages.slice(0, selectedPackageIndex).reduce((a, p) => a + p.words.length, 0) +
          1) /
          totalWords) *
          100
      )
    : 0;

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

      {/* Package Selection */}
      {!selectedPackage && (
        <div className="grid grid-cols-1 gap-3">
          {packages.map((pkg, index) => (
            <div
              key={pkg._id}
              className="p-4 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer flex justify-between items-center"
              onClick={() => setSelectedPackageIndex(index)}
            >
              <span>📦 {pkg.title} ({pkg.words.length} fjalë)</span>
              {completedPackages.includes(pkg._id) && <CheckCircle size={20} className="text-green-500" />}
            </div>
          ))}
        </div>
      )}

      {/* Word View */}
      {selectedPackage && currentWord && (
        <>
          <p className="text-xl font-semibold mb-1 text-center">📦 Paketë: {selectedPackage.title}</p>
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
          <p className="mt-1 text-sm text-center">
            {currentWordIndex + 1} / {selectedPackage.words.length} në paketën "{selectedPackage.title}"
          </p>

          <button
            onClick={nextWord}
            className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            ➡ Fjala tjetër
          </button>
        </>
      )}
    </div>
  );
};

export default Pronunciation;
