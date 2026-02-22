"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, ArrowLeft, Trophy, Target, Star, Flame, BookOpen } from "lucide-react";

const getLevelColor = (level) => {
  const map = {
    A1: "bg-emerald-50 text-emerald-600 border-emerald-200",
    A2: "bg-blue-50 text-blue-600 border-blue-200",
    B1: "bg-violet-50 text-violet-600 border-violet-200",
    B2: "bg-amber-50 text-amber-600 border-amber-200",
    C1: "bg-rose-50 text-rose-600 border-rose-200",
    C2: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };
  return map[level] || map.A1;
};

function analyzeWriting(userText, correctText) {
  const analysis = {
    capitalizationErrors: [],
    punctuationErrors: [],
    missingWords: [],
    extraWords: [],
    charDiff: [],
  };

  if (!userText || !correctText) return analysis;

  const correctWords = correctText.split(/\s+/);
  const userWords = userText.split(/\s+/);

  correctWords.forEach((cw, i) => {
    const uw = userWords[i];
    if (!uw) return;
    if (cw[0] !== cw[0].toLowerCase() && uw[0] === uw[0].toLowerCase()) {
      analysis.capitalizationErrors.push({ word: uw, expected: cw, position: i });
    }
  });

  const punctuationRegex = /[.,!?;:ÄäÖöÜüß"'()\-–—]/g;
  const correctPunctuation = correctText.match(punctuationRegex) || [];
  const userPunctuation = userText.match(punctuationRegex) || [];

  correctPunctuation.forEach((p, i) => {
    if (userPunctuation[i] !== p) {
      analysis.punctuationErrors.push({ expected: p, got: userPunctuation[i] || "(mungon)", position: i });
    }
  });

  const correctLower = correctWords.map((w) => w.toLowerCase().replace(/[.,!?;:]/g, ""));
  const userLower = userWords.map((w) => w.toLowerCase().replace(/[.,!?;:]/g, ""));

  correctLower.forEach((w) => {
    if (w && !userLower.includes(w)) analysis.missingWords.push(w);
  });
  userLower.forEach((w) => {
    if (w && !correctLower.includes(w)) analysis.extraWords.push(w);
  });

  const maxLen = Math.max(correctText.length, userText.length);
  for (let i = 0; i < maxLen; i++) {
    const cc = correctText[i];
    const uc = userText[i];
    if (!uc) analysis.charDiff.push({ char: cc, type: "missing" });
    else if (!cc) analysis.charDiff.push({ char: uc, type: "extra" });
    else if (cc === uc) analysis.charDiff.push({ char: cc, type: "correct" });
    else analysis.charDiff.push({ char: uc, type: "wrong", expected: cc });
  }

  return analysis;
}

function WritingFeedback({ userAnswer, correctAnswer }) {
  if (!userAnswer || !correctAnswer) return null;

  const analysis = analyzeWriting(userAnswer, correctAnswer);
  const hasErrors =
    analysis.capitalizationErrors.length > 0 ||
    analysis.punctuationErrors.length > 0 ||
    analysis.missingWords.length > 0 ||
    analysis.extraWords.length > 0;

  if (!hasErrors) {
    return (
      <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
        <div className="text-sm font-bold text-orange-700 mb-1">{"✓ Perfekt!"}</div>
        <p className="text-xs text-orange-600">{"Përgjigja juaj është e saktë pa gabime."}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-orange-50/50 border border-orange-200 rounded-xl">
      <div className="text-sm font-bold text-orange-700 mb-3">{"📝 Analiza e shkrimit"}</div>

      {analysis.capitalizationErrors.length > 0 && (
        <div className="flex justify-between items-center py-2 text-xs">
          <span className="text-slate-600">{"🔤 Shkronja e madhe mungon:"}</span>
          <span className="font-semibold text-orange-600">
            {analysis.capitalizationErrors.map((e) => `"${e.word}" → "${e.expected}"`).join(", ")}
          </span>
        </div>
      )}

      {analysis.punctuationErrors.length > 0 && (
        <div className="flex justify-between items-center py-2 text-xs">
          <span className="text-slate-600">{"✏️ Pikësimi:"}</span>
          <span className="font-semibold text-orange-600">
            {analysis.punctuationErrors.map((e) => `"${e.got}" → "${e.expected}"`).join(", ")}
          </span>
        </div>
      )}

      {analysis.missingWords.length > 0 && (
        <div className="flex justify-between items-center py-2 text-xs">
          <span className="text-slate-600">{"⚠️ Fjalë që mungojnë:"}</span>
          <span className="font-semibold text-orange-600">{analysis.missingWords.join(", ")}</span>
        </div>
      )}

      {analysis.extraWords.length > 0 && (
        <div className="flex justify-between items-center py-2 text-xs">
          <span className="text-slate-600">{"➕ Fjalë shtesë:"}</span>
          <span className="font-semibold text-orange-600">{analysis.extraWords.join(", ")}</span>
        </div>
      )}

      <div className="mt-3 p-3 bg-white/60 rounded-lg text-xs">
        <div className="text-slate-500 mb-2">{"Krahasimi karakter për karakter:"}</div>
        <div className="leading-relaxed">
          {analysis.charDiff.map((d, i) => (
            <span
              key={i}
              className={
                d.type === "correct"
                  ? "text-emerald-600"
                  : d.type === "wrong" || d.type === "extra"
                    ? "text-red-500 underline font-bold"
                    : "text-orange-500 underline font-bold"
              }
              title={
                d.type === "wrong"
                  ? `Pritet: "${d.expected}"`
                  : d.type === "missing"
                    ? "Karakter që mungon"
                    : d.type === "extra"
                      ? "Karakter shtesë"
                      : ""
              }
            >
              {d.char === " " ? "\u00A0" : d.char}
            </span>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-slate-500 flex gap-3">
          <span className="text-emerald-600">{"■ Saktë"}</span>
          <span className="text-red-500">{"■ Gabim"}</span>
          <span className="text-orange-500">{"■ Mungon"}</span>
        </div>
      </div>
    </div>
  );
}

function FadeIn({ children, className = "" }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-orange-500 rounded-full"
        style={{ width: `${value}%`, transition: "width 0.4s cubic-bezier(.4,0,.2,1)" }}
      />
    </div>
  );
}

const sectionIcons = {
  "Dëgjim": (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M3 18v-6a9 9 0 0118 0v6" strokeLinecap="round" />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
    </svg>
  ),
  Shkrim: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
    </svg>
  ),
  Lexim: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" strokeLinecap="round" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" strokeLinecap="round" />
    </svg>
  ),
};

export default function Exam() {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState("select");
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [listeningAnswers, setListeningAnswers] = useState([]);
  const [writingAnswers, setWritingAnswers] = useState([]);
  const [readingAnswers, setReadingAnswers] = useState([]);

  const [listeningScore, setListeningScore] = useState(0);
  const [writingScore, setWritingScore] = useState(0);
  const [readingScore, setReadingScore] = useState(0);

  const [listeningResults, setListeningResults] = useState([]);
  const [writingResults, setWritingResults] = useState([]);
  const [readingResults, setReadingResults] = useState([]);

  const [availableLevels, setAvailableLevels] = useState({});
  const [levelFilter, setLevelFilter] = useState("A1");
  const [selectedExam, setSelectedExam] = useState(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  const [finishedExams, setFinishedExams] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  const [questionKey, setQuestionKey] = useState(0);

  // FIX: use a ref to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAvailableLevels();
    loadFinishedExams();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadFinishedExams = () => {
    try {
      const saved = localStorage.getItem("finishedExams");
      if (saved) setFinishedExams(JSON.parse(saved));
    } catch (e) {
      console.error("Error loading finished exams:", e);
    }
  };

  const markExamAsFinished = useCallback(
    (examLabel, totalScore) => {
      if (totalScore >= 80) {
        const updated = { ...finishedExams, [examLabel]: { score: totalScore, finishedAt: new Date().toISOString() } };
        setFinishedExams(updated);
        localStorage.setItem("finishedExams", JSON.stringify(updated));
      }
    },
    [finishedExams]
  );

  const fetchAvailableLevels = async () => {
    try {
      const { examService } = await import("../services/api");
      const response = await examService.getAllExamLevels();
      setAvailableLevels(response.data || response);
    } catch (error) {
      console.error("Error fetching levels:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectExam = async (examLabel) => {
    try {
      setLoading(true);
      const { examService } = await import("../services/api");
      const [level, subLevel] = examLabel.split(".");
      const response = await examService.getExamsByLevel(level);
      const foundExam = (response.data || response).find((e) => e.subLevel === subLevel);

      if (foundExam) {
        setExam(foundExam);
        setSelectedExam(examLabel);
        setCurrentSection("listening");
        setListeningAnswers(new Array(foundExam.listeningQuestions.length).fill(""));
        setWritingAnswers(new Array(foundExam.writingQuestions.length).fill(""));
        setReadingAnswers(new Array(foundExam.readingQuestions.length).fill(""));
      }
    } catch (error) {
      console.error("Error loading exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const speakText = async (text) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setAudioLoading(true);
      setIsSpeaking(true);

      const { ttsService } = await import("../services/api");
      const audioUrl = await ttsService.getExamAudio(exam._id, currentQuestion, text, exam.level, currentSection);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = () => setAudioLoading(false);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setAudioLoading(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("Error getting TTS audio:", error);
      setIsSpeaking(false);
      setAudioLoading(false);
    }
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
  };

  const handleListeningAnswer = (answer) => {
    const n = [...listeningAnswers];
    n[currentQuestion] = answer;
    setListeningAnswers(n);
  };

  const handleWritingAnswer = (e) => {
    const n = [...writingAnswers];
    n[currentQuestion] = e.target.value;
    setWritingAnswers(n);
  };

  const handleReadingAnswer = (answer) => {
    const n = [...readingAnswers];
    n[currentQuestion] = answer;
    setReadingAnswers(n);
  };

  const nextQuestion = () => {
    const questions =
      currentSection === "listening"
        ? exam.listeningQuestions
        : currentSection === "writing"
          ? exam.writingQuestions
          : exam.readingQuestions;

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((p) => p + 1);
      setQuestionKey((p) => p + 1);
    } else {
      submitSection();
    }
  };

  const submitSection = async () => {
    try {
      if (currentSection === "listening") {
        const results = exam.listeningQuestions.map((q, index) => ({
          question: q.question || q.text,
          userAnswer: listeningAnswers[index],
          correctAnswer: q.correctAnswer,
          isCorrect: listeningAnswers[index] === q.correctAnswer,
        }));
        const correctCount = results.filter((r) => r.isCorrect).length;
        const score = (correctCount / exam.listeningQuestions.length) * 100;
        setListeningResults(results);
        setListeningScore(score);
        setCurrentSection("writing");
        setCurrentQuestion(0);
        setQuestionKey((p) => p + 1);
      } else if (currentSection === "writing") {
        const results = exam.writingQuestions.map((q, index) => {
          const normalizedCorrect = normalizeText(q.correctAnswer);
          const normalizedUser = normalizeText(writingAnswers[index]);
          const correctWords = normalizedCorrect.split(" ");
          const userWords = normalizedUser.split(" ");
          const matchedWords = userWords.filter((word) => correctWords.includes(word));
          const similarity = correctWords.length > 0 ? matchedWords.length / correctWords.length : 0;
          return {
            question: q.text,
            userAnswer: writingAnswers[index],
            correctAnswer: q.correctAnswer,
            isCorrect: similarity >= 0.8,
            similarity: Math.round(similarity * 100),
            analysis: analyzeWriting(writingAnswers[index], q.correctAnswer),
          };
        });
        const correctCount = results.filter((r) => r.isCorrect).length;
        const score = (correctCount / exam.writingQuestions.length) * 100;
        setWritingResults(results);
        setWritingScore(score);
        setCurrentSection("reading");
        setCurrentQuestion(0);
        setQuestionKey((p) => p + 1);
      } else if (currentSection === "reading") {
        const results = exam.readingQuestions.map((q, index) => {
          const parts = q.text.split("\n\n");
          const question = parts.length > 1 ? parts[parts.length - 1] : q.text;
          return {
            question,
            userAnswer: readingAnswers[index],
            correctAnswer: q.correctAnswer,
            isCorrect: readingAnswers[index] === q.correctAnswer,
          };
        });
        const correctCount = results.filter((r) => r.isCorrect).length;
        const score = (correctCount / exam.readingQuestions.length) * 100;
        setReadingResults(results);
        setReadingScore(score);

        const totalScore = Math.round((listeningScore + writingScore + score) / 3);
        if (selectedExam) markExamAsFinished(selectedExam, totalScore);

        try {
          const { examService } = await import("../services/api");
          await examService.submitCompleteExam({
            examId: exam._id,
            listeningAnswers,
            writingAnswers,
            readingAnswers,
            listeningScore,
            writingScore,
            readingScore: score,
          });
        } catch (err) {
          console.error("Error submitting exam:", err);
        }

        setCurrentSection("results");
      }
    } catch (error) {
      console.error("Error submitting section:", error);
    }
  };

  const filteredExams = Object.entries(availableLevels).reduce((acc, [level, subLevels]) => {
    if (level === levelFilter) acc[level] = subLevels;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 font-medium text-sm">{"Po ngarkohet..."}</p>
        </div>
      </div>
    );
  }

  if (currentSection === "results") {
    const totalScore = Math.round((listeningScore + writingScore + readingScore) / 3);
    const passed = totalScore >= 75;

    const allResults = [
      { section: "Dëgjim", results: listeningResults, score: listeningScore, color: "blue" },
      { section: "Shkrim", results: writingResults, score: writingScore, color: "orange" },
      { section: "Lexim", results: readingResults, score: readingScore, color: "green" },
    ];

    return (
      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <FadeIn className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl border p-5 mb-4"
            style={{
              background: passed
                ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
                : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              borderColor: passed ? "#fdba74" : "#e2e8f0",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: passed ? "#fed7aa" : "#fef3c7" }}
                >
                  {passed ? (
                    <Trophy className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Target className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {passed ? "Shkëlqyeshëm!" : "Vazhdo të ushtrosh!"}
                  </h2>
                  {totalScore >= 80 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-semibold mt-0.5">
                      <Flame className="w-3 h-3" />
                      {"Provimi u shënua si i përfunduar"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-orange-600">{totalScore}%</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{"Totali"}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {allResults.map(({ section, score }) => {
                const chipColors = {
                  "Dëgjim": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
                  Shkrim: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
                  Lexim: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
                };
                const c = chipColors[section];
                return (
                  <div key={section} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.border} ${c.bg}`}>
                    <span className={c.text}>{sectionIcons[section]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">{section}</div>
                      <div className={`text-sm font-bold ${c.text}`}>{Math.round(score)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setCurrentSection("select");
                setCurrentQuestion(0);
                setExam(null);
              }}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-colors"
            >
              {"Kthehu te Provimet"}
            </button>
          </div>

          {allResults.map(({ section, results }) => {
            const badgeColors = {
              "Dëgjim": "bg-blue-100 text-blue-600",
              Shkrim: "bg-orange-100 text-orange-600",
              Lexim: "bg-emerald-100 text-emerald-600",
            };
            const badge = badgeColors[section];
            const correctCount = results.filter((r) => r.isCorrect).length;
            const isOpen = expandedSections?.[section] ?? false;

            return (
              <div key={section} className="bg-white rounded-xl border border-slate-200 mb-3 overflow-hidden">
                <button
                  onClick={() => setExpandedSections((prev) => ({ ...prev, [section]: !prev?.[section] }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`${badge} w-6 h-6 rounded flex items-center justify-center`}>
                      {sectionIcons[section]}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{section}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {correctCount}/{results.length} {"sakte"}
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    className="text-slate-400"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.map((result, index) => (
                        <div key={index} className="flex flex-col">
                          <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${result.isCorrect ? "bg-white border-emerald-200" : "bg-white border-red-200"
                              }`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${result.isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                                }`}
                            >
                              {result.isCorrect ? (
                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 truncate">{result.question}</p>
                              <p className={`text-[10px] truncate ${result.isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                                {result.userAnswer || "(pa pergjigje)"}
                              </p>
                              {!result.isCorrect && (
                                <p className="text-[10px] text-emerald-600 truncate">
                                  {"→ "}
                                  {result.correctAnswer}
                                </p>
                              )}
                              {result.similarity !== undefined && <p className="text-[10px] text-slate-400">{result.similarity}%</p>}
                            </div>
                          </div>
                          {section === "Shkrim" && result.userAnswer && (
                            <WritingFeedback userAnswer={result.userAnswer} correctAnswer={result.correctAnswer} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </FadeIn>
      </div>
    );
  }

  if (currentSection === "select") {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <FadeIn className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{"Përgatitje për Provime"}</h1>
            <p className="text-slate-500 text-sm">
              {"Zgjidhni nivelin tuaj dhe filloni testin për të vlerësuar njohuritë tuaja."}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{"Filtro sipas Nivelit"}</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(availableLevels).map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${levelFilter === level ? getLevelColor(level) : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(filteredExams).map(([level, subLevels]) =>
              [...subLevels].sort((a, b) => {
                const numA = parseFloat(a.split('.')[1]) || 0;
                const numB = parseFloat(b.split('.')[1]) || 0;
                return numA - numB;
              }).map((examLabel) => {
                const isFinished = !!finishedExams[examLabel];
                const finishedScore = finishedExams[examLabel]?.score;

                return (
                  <button
                    key={examLabel}
                    onClick={() => selectExam(examLabel)}
                    className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all border active:scale-[0.98] ${isFinished
                        ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                  >
                    <span className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-bold border ${getLevelColor(level)}`}>
                      {level}
                    </span>

                    <span className={`text-sm font-semibold flex-1 ${isFinished ? "text-orange-700" : "text-slate-800"}`}>
                      {examLabel}
                    </span>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isFinished && (
                        <span className="text-[10px] font-bold text-orange-500 mr-1">{finishedScore}%</span>
                      )}
                      <svg width="14" height="14" fill="none" stroke={isFinished ? "#f97316" : "#94a3b8"} viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M3 18v-6a9 9 0 0118 0v6" strokeLinecap="round" />
                        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
                      </svg>
                      <svg width="14" height="14" fill="none" stroke={isFinished ? "#f97316" : "#94a3b8"} viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                      </svg>
                      <svg width="14" height="14" fill="none" stroke={isFinished ? "#f97316" : "#94a3b8"} viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" strokeLinecap="round" />
                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" strokeLinecap="round" />
                      </svg>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </FadeIn>
      </div>
    );
  }

  const questions =
    currentSection === "listening"
      ? exam.listeningQuestions
      : currentSection === "writing"
        ? exam.writingQuestions
        : exam.readingQuestions;

  const sectionLabels = { listening: "Dëgjim", writing: "Shkrim", reading: "Lexim" };
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const sectionAccent = {
    listening: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700" },
    writing: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600", btn: "bg-orange-600 hover:bg-orange-700" },
    reading: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" },
  };
  const accent = sectionAccent[currentSection];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <FadeIn key={questionKey} className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCurrentSection("select")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">{"Mbrapa"}</span>
          </button>

          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getLevelColor(exam.level)}`}>{exam.level}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">{sectionLabels[currentSection]}</span>
              <span className="text-orange-600 font-bold">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            <ProgressBar value={progress} />

            <div className="mt-4">
             {currentSection !== "writing" && currentSection !== "reading" && (
  <h2 className="text-base font-semibold text-slate-800 mb-4 leading-snug">{currentQ.question || currentQ.text}</h2>
)}

              {currentSection === "listening" && (
                <div>
                  <div className={`mb-3 flex items-center gap-2.5 p-2.5 ${accent.bg} border ${accent.border} rounded-lg`}>
                    <button
                      onClick={() => speakText(currentQ.text)}
                      disabled={isSpeaking || audioLoading}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors ${isSpeaking || audioLoading
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : `${accent.btn} text-white`
                        }`}
                    >
                      {audioLoading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>...</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                          {isSpeaking ? "Po luhet..." : "Luaj Audio"}
                        </>
                      )}
                    </button>
                    <span className={`text-xs ${accent.text} leading-snug`}>
                      {"Klikoni per te degjuar tekstin, pastaj pergjigjuni pyetjes."}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQ.options?.map((option, index) => {
                      const isSelected = listeningAnswers[currentQuestion] === option;
                      const letter = String.fromCharCode(65 + index);
                      return (
                        <button
                          key={index}
                          onClick={() => handleListeningAnswer(option)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors border ${isSelected
                              ? "bg-orange-50 border-orange-400"
                              : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded text-[10px] font-semibold flex items-center justify-center ${isSelected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                          >
                            {letter}
                          </span>
                          <span className={`text-xs font-medium leading-tight ${isSelected ? "text-orange-700" : "text-slate-600"}`}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentSection === "writing" && (
                <div>
                  <div className={`mb-3 flex items-center gap-2.5 p-2.5 ${accent.bg} border ${accent.border} rounded-lg`}>
                    <button
                      onClick={() => speakText(currentQ.text)}
                      disabled={isSpeaking || audioLoading}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors ${isSpeaking || audioLoading
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : `${accent.btn} text-white`
                        }`}
                    >
                      {audioLoading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>...</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                          {isSpeaking ? "Po luhet..." : "Luaj Audio"}
                        </>
                      )}
                    </button>
                    <span className={`text-xs ${accent.text} leading-snug`}>
                      {"Degjoni dhe shkruani sakteisht. Kujdes me (a, o, u, ß)."}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
                    {["Ä", "ä", "Ö", "ö", "Ü", "ü", "ß", ".", ",", "!", "?"].map((char) => (
                      <button
                        key={char}
                        onClick={() => {
                          const n = [...writingAnswers];
                          n[currentQuestion] = (n[currentQuestion] || "") + char;
                          setWritingAnswers(n);
                        }}
                        className="px-2.5 py-1 rounded-md border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100 hover:border-orange-300 transition-colors"
                      >
                        {char}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={writingAnswers[currentQuestion] || ""}
                    onChange={handleWritingAnswer}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 focus:outline-none resize-none h-20 text-xs"
                    placeholder="Shkruani pergjigjen tuaj ketu..."
                  />
                </div>
              )}

              {currentSection === "reading" && (
                <div>
                  {(() => {
                    const parts = currentQ.text.split("\n\n");
                    const passage = parts.length > 1 ? parts.slice(0, -1).join("\n\n") : "";
                    const question = parts.length > 1 ? parts[parts.length - 1] : currentQ.text;

                    return (
                      <>
                        {passage && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 whitespace-pre-line text-sm text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                            {passage}
                          </div>
                        )}
                        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg mb-4">
                          <p className="font-semibold text-slate-800 text-sm">{question}</p>
                        </div>
                      </>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQ.options?.map((option, index) => {
                      const isSelected = readingAnswers[currentQuestion] === option;
                      const letter = String.fromCharCode(65 + index);
                      return (
                        <button
                          key={index}
                          onClick={() => handleReadingAnswer(option)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors border ${isSelected
                              ? "bg-orange-50 border-orange-400"
                              : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded text-[10px] font-semibold flex items-center justify-center ${isSelected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                          >
                            {letter}
                          </span>
                          <span className={`text-xs font-medium leading-tight ${isSelected ? "text-orange-700" : "text-slate-600"}`}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={nextQuestion}
            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-colors active:scale-[0.98]"
          >
            {currentQuestion < questions.length - 1 ? "Vazhdo" : "Përfundo Seksionin"}
          </button>
        </div>
      </FadeIn>
    </div>
  );
}