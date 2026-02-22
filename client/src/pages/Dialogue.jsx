import React, { useState, useRef, useEffect } from 'react';
import { dialogueAPI } from '../services/api';

const LEVEL_COLORS = {
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-lime-100 text-lime-700',
  B1: 'bg-yellow-100 text-yellow-700',
  B2: 'bg-orange-100 text-orange-700',
  C1: 'bg-red-100 text-red-700',
  C2: 'bg-purple-100 text-purple-700',
};

const VOICE_IDS = {
  rachel: 'EXAVITQu4vr4xnSDxMaL',
  adam: 'pNInz6obpgDQGcFmaJgB',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  bella: 'EXAVITQu4vr4xnSDxMaL',
  elli: '21m00Tcm4TlvDq8ikWAM',
};

function StoryBrowser({ onSelectStory }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    dialogueAPI.getStories(levelFilter)
      .then(data => {
        setStories(Array.isArray(data) ? data : (data.data || []));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load stories:', err);
        setLoading(false);
      });
  }, [levelFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl animate-pulse">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dialogue Stories</h1>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setLevelFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              !levelFilter ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                levelFilter === level ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {stories.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <p className="text-xl mb-2">No stories found.</p>
            <p className="text-sm">Check that your API endpoint returns stories.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {stories.map(story => (
              <button
                key={story._id}
                onClick={() => onSelectStory(story._id)}
                className="bg-slate-800 hover:bg-slate-700 rounded-2xl p-5 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold">{story.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${LEVEL_COLORS[story.level]}`}>
                      {story.level}
                    </span>
                    {story.category && (
                      <span className="text-xs bg-slate-600 px-3 py-1 rounded-full text-slate-200">
                        {story.category.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-yellow-400 font-bold text-sm">+{story.xp_reward || 50} XP</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dialogue({ storyId: propStoryId }) {
  const [storyId, setStoryId] = useState(propStoryId || null);
  const [story, setStory] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState('loading_audio');
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [xpEarned, setXpEarned] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!storyId) return;
    dialogueAPI.getStoryById(storyId)
      .then(data => {
        const storyData = data.data || data;
        setStory(storyData);
        setCurrentStep(0);
        setPhase('loading_audio');
      });
  }, [storyId]);

  useEffect(() => {
    if (!story || !story.dialogues || story.dialogues.length === 0) return;
    const step = story.dialogues[currentStep];
    if (!step) return;

    setSelectedOption(null);
    setFeedback(null);
    setSelectedWords([]);
    setPhase('loading_audio');

    if (step.word_boxes && step.word_boxes.words) {
      const shuffled = [...step.word_boxes.words].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
    } else {
      setAvailableWords([]);
    }

    loadAndPlayAudio(step);
  }, [currentStep, story]);

  const loadAndPlayAudio = async (step) => {
    try {
      const voiceId = step.speaker === 'You' ? VOICE_IDS.josh : VOICE_IDS.rachel;
      
      const data = await dialogueAPI.getDialogueAudio(
        story._id,
        currentStep,
        step.text,
        story.level,
        voiceId
      );

      if (data.url && audioRef.current) {
        audioRef.current.src = data.url;
        audioRef.current.onended = () => {
          if (step.response_type === 'none') {
            setTimeout(() => advanceStep(), 800);
          } else {
            setPhase('answering');
          }
        };
        audioRef.current.play();
        setPhase('playing');
      } else {
        if (step.response_type === 'none') {
          setTimeout(() => advanceStep(), 800);
        } else {
          setPhase('answering');
        }
      }
    } catch (err) {
      console.error('Audio error:', err);
      if (step.response_type === 'none') {
        setTimeout(() => advanceStep(), 800);
      } else {
        setPhase('answering');
      }
    }
  };

  const advanceStep = () => {
    if (!story) return;
    if (currentStep + 1 >= story.dialogues.length) {
      setPhase('complete');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleOptionSelect = async (option) => {
    if (phase !== 'answering') return;
    setSelectedOption(option.text);

    const data = await dialogueAPI.checkAnswer(story._id, currentStep, option.text);
    const result = data.data || data;
    setFeedback(result);
    setPhase('feedback');

    if (result.is_correct) setXpEarned(prev => prev + 10);
    setTimeout(() => advanceStep(), 1500);
  };

  const handleWordBoxSubmit = async () => {
    if (phase !== 'answering') return;
    const answer = selectedWords.join(' ');

    const data = await dialogueAPI.checkAnswer(story._id, currentStep, answer);
    const result = data.data || data;
    setFeedback(result);
    setPhase('feedback');

    if (result.is_correct) setXpEarned(prev => prev + 15);
    setTimeout(() => advanceStep(), 1800);
  };

  const addWord = (word, index) => {
    setSelectedWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
  };

  const removeWord = (word, index) => {
    setAvailableWords(prev => [...prev, word]);
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    setStoryId(null);
    setStory(null);
    setCurrentStep(0);
    setPhase('loading_audio');
    setXpEarned(0);
  };

  if (!storyId) {
    return <StoryBrowser onSelectStory={(id) => setStoryId(id)} />;
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl animate-pulse">Loading story...</div>
      </div>
    );
  }

  if (!story.dialogues || story.dialogues.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="text-white text-xl mb-4">No dialogues found for this story.</div>
          <button onClick={handleBack} className="text-blue-400 hover:text-blue-300 underline">
            ← Back to stories
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-6">
        <div className="bg-slate-800 rounded-3xl p-10 text-center max-w-md w-full shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-2">Story Complete!</h2>
          <p className="text-slate-400 mb-6">{story.title}</p>
          <div className="bg-yellow-400 text-yellow-900 rounded-2xl py-4 px-8 inline-block font-bold text-2xl">
            +{xpEarned + (story.xp_reward || 50)} XP
          </div>
          <p className="text-slate-400 mt-4 text-sm">
            {xpEarned} bonus XP from correct answers + {story.xp_reward || 50} completion XP
          </p>
          <button
            onClick={handleBack}
            className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            ← Back to Stories
          </button>
        </div>
      </div>
    );
  }

  const step = story.dialogues[currentStep];
  const progress = (currentStep / story.dialogues.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <audio ref__={audioRef} />

      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-slate-400 hover:text-white text-sm">
              ← Back
            </button>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${LEVEL_COLORS[story.level]}`}>
              {story.level}
            </span>
          </div>
          <h1 className="text-sm font-semibold text-slate-300">{story.title}</h1>
          <span className="text-xs text-yellow-400 font-bold">+{xpEarned} XP</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1 text-right">
          {currentStep + 1} / {story.dialogues.length}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 gap-4">
        <div className="w-full max-w-lg">
          <div className={`flex gap-3 ${step.speaker === 'You' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
              {step.speaker === 'You' ? '🧑' : '🏪'}
            </div>
            <div
              className={`rounded-2xl px-5 py-4 max-w-xs shadow-lg ${
                step.speaker === 'You'
                  ? 'bg-blue-600 rounded-tr-sm'
                  : 'bg-slate-700 rounded-tl-sm'
              }`}
            >
              <p className="text-xs text-slate-400 mb-1 font-semibold">{step.speaker}</p>
              <p className="text-base leading-relaxed">{step.text}</p>
            </div>
          </div>

          {phase === 'playing' && (
            <div className="flex items-center gap-2 mt-4 ml-16">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-green-400 rounded-full animate-bounce"
                    style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">Playing audio...</span>
            </div>
          )}

          {phase === 'loading_audio' && (
            <p className="text-xs text-slate-500 mt-3 ml-16 animate-pulse">Loading audio...</p>
          )}
        </div>

        {(phase === 'answering' || phase === 'feedback') && (
          <div className="w-full max-w-lg mt-4">

            {step.response_type === 'multiple_choice' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-400 mb-1">Choose your response:</p>
                {step.options.map((option, i) => {
                  let btnClass = 'bg-slate-700 border border-slate-600 text-white hover:bg-slate-600';
                  if (phase === 'feedback' && selectedOption === option.text) {
                    btnClass = feedback.is_correct
                      ? 'bg-green-600 border border-green-500 text-white'
                      : 'bg-red-600 border border-red-500 text-white';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(option)}
                      disabled={phase === 'feedback'}
                      className={`w-full text-left px-5 py-4 rounded-2xl font-medium transition-all ${btnClass}`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            )}

            {step.response_type === 'word_boxes' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-400">Build the sentence:</p>

                <div
                  className={`min-h-14 border-2 rounded-2xl p-3 flex flex-wrap gap-2 transition-colors ${
                    phase === 'feedback'
                      ? feedback.is_correct
                        ? 'border-green-500 bg-green-900/30'
                        : 'border-red-500 bg-red-900/30'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  {selectedWords.length === 0 && (
                    <span className="text-slate-500 text-sm self-center">Tap words below...</span>
                  )}
                  {selectedWords.map((word, i) => (
                    <button
                      key={i}
                      onClick={() => removeWord(word, i)}
                      disabled={phase === 'feedback'}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableWords.map((word, i) => (
                    <button
                      key={i}
                      onClick={() => addWord(word, i)}
                      disabled={phase === 'feedback'}
                      className="bg-slate-700 border border-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {phase === 'answering' && selectedWords.length > 0 && (
                  <button
                    onClick={handleWordBoxSubmit}
                    className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl transition-all text-lg"
                  >
                    Check ✓
                  </button>
                )}

                {phase === 'feedback' && (
                  <div className={`text-center font-bold text-lg py-3 rounded-2xl ${
                    feedback.is_correct ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {feedback.is_correct
                      ? '✅ Correct!'
                      : `❌ The answer was: "${step.word_boxes.correct_sentence}"`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}