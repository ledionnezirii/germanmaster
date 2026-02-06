import React, { useState, useEffect } from 'react';
import { flashCardService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Flashcard = () => {
  const { user, updateUser } = useAuth();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  const userXP = user?.xp || 0;
  const userLevel = user?.level || 1;

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const response = await flashCardService.getAllFlashCards();
      setFlashcards(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      setLoading(false);
    }
  };

  const handleCheckAnswer = async () => {
    const currentCard = flashcards[currentIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === currentCard.translation.toLowerCase().trim();

    if (isCorrect) {
      setFeedback('✅ Correct!');
      
      try {
        const response = await flashCardService.addXP(currentCard.xp_value);
        
        // Update user context with new XP and level
        updateUser({
          xp: response.data.total_xp || response.total_xp,
          level: response.data.current_level || response.current_level
        });
      } catch (error) {
        console.error('Error adding XP:', error);
      }

      setTimeout(() => {
        nextCard();
      }, 1500);
    } else {
      setFeedback(`❌ Wrong! Correct answer: ${currentCard.translation}`);
      setShowAnswer(true);
    }
  };

  const nextCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    setShowAnswer(false);
    setUserAnswer('');
    setFeedback('');
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-xl text-gray-600">Loading flashcards...</div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-xl text-gray-600">No flashcards available</div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const xpToNextLevel = (userLevel * 100) - userXP;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with XP and Level */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">German Flashcards</h1>
              <p className="text-gray-600 mt-1">Learn German with XP rewards!</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl shadow-md">
                  <div className="text-sm font-semibold">Level</div>
                  <div className="text-3xl font-bold">{userLevel}</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md">
                  <div className="text-sm font-semibold">Total XP</div>
                  <div className="text-3xl font-bold">{userXP}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {xpToNextLevel} XP to next level
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(userXP % 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-4">
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
              {currentCard.difficulty} • {currentCard.category}
            </span>
            <span className="ml-3 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              +{currentCard.xp_value} XP
            </span>
          </div>

          <div
            className="relative cursor-pointer"
            onClick={flipCard}
            style={{ minHeight: '300px' }}
          >
            <div className="flex items-center justify-center h-full">
              {!showAnswer ? (
                <div className="text-center">
                  <h2 className="text-6xl font-bold text-gray-800 mb-4">
                    {currentCard.german_word}
                  </h2>
                  <p className="text-gray-500 text-lg">Click to reveal answer</p>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-5xl font-bold text-blue-600 mb-4">
                    {currentCard.translation}
                  </h2>
                  <p className="text-gray-500 text-lg">English Translation</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-gray-400 mt-4">
            Card {currentIndex + 1} of {flashcards.length}
          </div>
        </div>

        {/* Answer Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Your Answer:
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCheckAnswer()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                placeholder="Type the English translation..."
              />
            </div>

            {feedback && (
              <div
                className={`p-4 rounded-lg text-center font-semibold text-lg ${
                  feedback.includes('Correct')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCheckAnswer}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
              >
                Check Answer
              </button>
              <button
                onClick={nextCard}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Next Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;