import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../services/api';

const Exam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('select');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [listeningAnswers, setListeningAnswers] = useState([]);
  const [writingAnswers, setWritingAnswers] = useState([]);
  const [readingAnswers, setReadingAnswers] = useState([]);
  
  const [listeningScore, setListeningScore] = useState(0);
  const [writingScore, setWritingScore] = useState(0);
  const [readingScore, setReadingScore] = useState(0);
  
  const [availableLevels, setAvailableLevels] = useState({});
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    fetchAvailableLevels();
  }, []);

  const fetchAvailableLevels = async () => {
    try {
      const response = await examService.getAllExamLevels();
      setAvailableLevels(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLoading(false);
    }
  };

  const selectExam = async (examLabel) => {
    try {
      setLoading(true);
      const [level, subLevel] = examLabel.split('.');
      
      const response = await examService.getExamsByLevel(level);
      const foundExam = (response.data || response).find(e => e.subLevel === subLevel);
      
      if (foundExam) {
        setExam(foundExam);
        setSelectedExam(examLabel);
        setCurrentSection('listening');
        setListeningAnswers(new Array(foundExam.listeningQuestions.length).fill(''));
        setWritingAnswers(new Array(foundExam.writingQuestions.length).fill(''));
        setReadingAnswers(new Array(foundExam.readingQuestions.length).fill(''));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam:', error);
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  const handleListeningAnswer = (answer) => {
    const newAnswers = [...listeningAnswers];
    newAnswers[currentQuestion] = answer;
    setListeningAnswers(newAnswers);
  };

  const handleWritingAnswer = (e) => {
    const newAnswers = [...writingAnswers];
    newAnswers[currentQuestion] = e.target.value;
    setWritingAnswers(newAnswers);
  };

  const handleReadingAnswer = (answer) => {
    const newAnswers = [...readingAnswers];
    newAnswers[currentQuestion] = answer;
    setReadingAnswers(newAnswers);
  };

  const nextQuestion = () => {
    const questions = currentSection === 'listening' 
      ? exam.listeningQuestions 
      : currentSection === 'writing' 
      ? exam.writingQuestions 
      : exam.readingQuestions;
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitSection();
    }
  };

  const submitSection = async () => {
    try {
      if (currentSection === 'listening') {
        const response = await examService.submitListening(exam._id, listeningAnswers);
        setListeningScore((response.data || response).score);
        setCurrentSection('writing');
        setCurrentQuestion(0);
      } else if (currentSection === 'writing') {
        const response = await examService.submitWriting(exam._id, writingAnswers);
        setWritingScore((response.data || response).score);
        setCurrentSection('reading');
        setCurrentQuestion(0);
      } else if (currentSection === 'reading') {
        const response = await examService.submitReading(exam._id, readingAnswers);
        setReadingScore((response.data || response).score);
        
        await examService.submitCompleteExam({
          examId: exam._id,
          listeningAnswers,
          writingAnswers,
          readingAnswers,
          listeningScore,
          writingScore,
          readingScore: (response.data || response).score
        });
        
        setCurrentSection('results');
      }
    } catch (error) {
      console.error('Error submitting section:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (currentSection === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">ÖSD & Goethe Exam Preparation</h1>
            <p className="text-xl text-gray-600">Choose your exam level to begin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(availableLevels).map(([level, subLevels]) => (
              <div key={level} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">{level}</h3>
                <div className="space-y-2">
                  {subLevels.map((examLabel) => (
                    <button
                      key={examLabel}
                      onClick={() => selectExam(examLabel)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-medium"
                    >
                      {examLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentSection === 'results') {
    const totalScore = Math.round((listeningScore + writingScore + readingScore) / 3);
    const passed = totalScore >= 75;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-8">
            {passed ? (
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h2>
            <p className="text-xl text-gray-600">
              Your total score: <span className="font-bold text-blue-600">{totalScore}%</span>
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="font-medium text-gray-700">Listening</span>
              <span className="text-xl font-bold text-blue-600">{Math.round(listeningScore)}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
              <span className="font-medium text-gray-700">Writing</span>
              <span className="text-xl font-bold text-purple-600">{Math.round(writingScore)}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="font-medium text-gray-700">Reading</span>
              <span className="text-xl font-bold text-green-600">{Math.round(readingScore)}%</span>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentSection('select');
              setCurrentQuestion(0);
              setExam(null);
            }}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium text-lg"
          >
            Back to Exam Selection
          </button>
        </div>
      </div>
    );
  }

  const questions = currentSection === 'listening' 
    ? exam.listeningQuestions 
    : currentSection === 'writing' 
    ? exam.writingQuestions 
    : exam.readingQuestions;

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-gray-900 capitalize">{currentSection} Section</h2>
            <span className="text-lg text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          {currentSection === 'listening' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <button
                  onClick={() => speakText(currentQ.text)}
                  disabled={isSpeaking}
                  className="px-8 py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400 transition-all duration-300 font-medium text-lg flex items-center gap-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  {isSpeaking ? 'Playing...' : 'Play Audio'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleListeningAnswer(option)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      listeningAnswers[currentQuestion] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-lg">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'writing' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <button
                  onClick={() => speakText(currentQ.text)}
                  disabled={isSpeaking}
                  className="px-8 py-4 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:bg-gray-400 transition-all duration-300 font-medium text-lg flex items-center gap-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  {isSpeaking ? 'Playing...' : 'Play Audio'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Write what you hear:
                </label>
                <textarea
                  value={writingAnswers[currentQuestion]}
                  onChange={handleWritingAnswer}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none h-40 text-lg"
                  placeholder="Type your answer here..."
                />
              </div>
            </div>
          )}

          {currentSection === 'reading' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">{currentQ.text}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleReadingAnswer(option)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      readingAnswers[currentQuestion] === option
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-lg">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={nextQuestion}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium text-lg"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Exam;