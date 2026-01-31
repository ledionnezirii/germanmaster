import React, { useState, useEffect } from 'react';
import { structureService, ttsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Trophy, Award, ChevronLeft, ChevronRight, CheckCircle, XCircle, Edit3, List, Volume2, Loader2 } from 'lucide-react';

const Structure = () => {
  const { user, updateUser } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState('A1');
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [completedStructures, setCompletedStructures] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState('write'); // 'write' or 'options'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  
  // Pagination states
  const [currentStructurePage, setCurrentStructurePage] = useState(1);
  const [currentItemPage, setCurrentItemPage] = useState(1);
  const structuresPerPage = 40;
  const itemsPerPage = 40;

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    fetchStructures();
    fetchUserProgress();
  }, [selectedLevel]);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const response = await structureService.getAllStructures(selectedLevel);
      setStructures(response.data);
      setCurrentStructurePage(1);
    } catch (error) {
      console.error('Error fetching structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await structureService.getUserProgress();
      setCompletedStructures(response.data.completedStructures.map(s => s._id || s));
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleBoxClick = async (structure) => {
    setSelectedStructure(structure);
    setShowQuiz(false);
    setQuizResult(null);
    setQuizAnswers({});
    setCurrentItemPage(1);
  };

  const handleStartQuiz = (mode) => {
    setQuizMode(mode);
    setShowQuiz(true);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const playAudio = async (structureId, itemIndex, germanWord, level) => {
    try {
      setPlayingAudio(`${itemIndex}`);
      const audioUrl = await ttsService.getStructureAudio(structureId, itemIndex, germanWord, level);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  const generateQuizOptions = (correctAnswer, allItems) => {
    const options = [correctAnswer];
    const otherItems = allItems.filter(item => item.german !== correctAnswer);
    
    while (options.length < 4 && otherItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherItems.length);
      const randomOption = otherItems[randomIndex].german;
      if (!options.includes(randomOption)) {
        options.push(randomOption);
      }
      otherItems.splice(randomIndex, 1);
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const handleQuizAnswer = (index, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [index]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedStructure) return;

    let correct = 0;
    selectedStructure.items.forEach((item, index) => {
      const userAnswer = quizAnswers[index]?.toLowerCase().trim();
      const correctAnswer = item.german.toLowerCase().trim();
      
      if (userAnswer === correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / selectedStructure.items.length) * 100);

    try {
      const response = await structureService.submitQuiz(selectedStructure._id, score);
      setQuizResult(response.data);

      if (response.data.success && response.data.completed) {
        updateUser({ xp: response.data.totalXp });
        fetchUserProgress();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const isCompleted = (structureId) => {
    return completedStructures.includes(structureId);
  };

  // Pagination logic for structures
  const indexOfLastStructure = currentStructurePage * structuresPerPage;
  const indexOfFirstStructure = indexOfLastStructure - structuresPerPage;
  const currentStructures = structures.slice(indexOfFirstStructure, indexOfLastStructure);
  const totalStructurePages = Math.ceil(structures.length / structuresPerPage);

  // Pagination logic for items
  const indexOfLastItem = currentItemPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = selectedStructure ? selectedStructure.items.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalItemPages = selectedStructure ? Math.ceil(selectedStructure.items.length / itemsPerPage) : 0;

  const typeIcons = {
    verbs: '📝',
    sentences: '💬',
    nouns: '📦',
    adjectives: '🎨',
    phrases: '💡',
    grammar: '📚'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-poppins">Struktura e Gjuhës</h1>
                <p className="text-gray-600 font-inter mt-1">Mëso gjermanishten hap pas hapi</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900 font-inter">{user?.xp || 0} XP</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900 font-inter">{completedStructures.length} Përfunduar</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Level Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 font-poppins">Zgjidhni nivelin:</h2>
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(level);
                  setSelectedStructure(null);
                  setCurrentStructurePage(1);
                }}
                className={`px-5 py-2.5 rounded-lg font-semibold font-inter transition-all duration-300 ${
                  selectedLevel === level
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-300 shadow-sm'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Main Structure Boxes */}
        {!selectedStructure && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-poppins mb-2">Temat për nivel {selectedLevel}</h2>
              <p className="text-gray-600 font-inter">Zgjidhni një temë për të filluar mësimin</p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-4 font-inter">Duke ngarkuar...</p>
              </div>
            ) : structures.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <p className="text-gray-500 text-lg font-inter">Asnjë temë e disponueshme për këtë nivel</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentStructures.map((structure) => (
                    <div
                      key={structure._id}
                      onClick={() => handleBoxClick(structure)}
                      className={`relative bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                        isCompleted(structure._id)
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-200 hover:border-indigo-400'
                      }`}
                    >
                      {isCompleted(structure._id) && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1.5">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className="text-4xl mb-3">{typeIcons[structure.type] || '📖'}</div>
                      <div className="mb-3">
                        <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold mb-2 font-inter">
                          {structure.type.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 font-poppins line-clamp-2">{structure.title}</h3>
                        {structure.description && (
                          <p className="text-gray-600 text-sm font-inter line-clamp-2">{structure.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm mt-4 pt-3 border-t border-gray-200">
                        <span className="text-gray-500 font-inter">{structure.items.length} artikuj</span>
                        <span className="font-bold text-indigo-600 font-inter">+{structure.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination for structures */}
                {totalStructurePages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => setCurrentStructurePage(prev => Math.max(prev - 1, 1))}
                      disabled={currentStructurePage === 1}
                      className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-gray-700 font-inter font-medium">
                      Faqja {currentStructurePage} nga {totalStructurePages}
                    </span>
                    <button
                      onClick={() => setCurrentStructurePage(prev => Math.min(prev + 1, totalStructurePages))}
                      disabled={currentStructurePage === totalStructurePages}
                      className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Structure Detail View */}
        {selectedStructure && !showQuiz && (
          <>
            <button
              onClick={() => {
                setSelectedStructure(null);
                setCurrentItemPage(1);
              }}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 font-inter"
            >
              <ChevronLeft className="w-5 h-5" />
              Kthehu te temat
            </button>

            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{typeIcons[selectedStructure.type] || '📖'}</span>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 font-poppins">{selectedStructure.title}</h2>
                      {selectedStructure.description && (
                        <p className="text-gray-600 font-inter mt-1">{selectedStructure.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600 font-poppins">+{selectedStructure.xp} XP</div>
                  <div className="text-sm text-gray-500 font-inter">{selectedStructure.items.length} artikuj gjithsej</div>
                </div>
              </div>

              {/* Quiz buttons - Now always visible, even if completed */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => handleStartQuiz('write')}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold font-inter hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  {isCompleted(selectedStructure._id) ? 'Riprovo Kuizin - Shkruaj' : 'Fillo Kuizin - Shkruaj'}
                </button>
                <button
                  onClick={() => handleStartQuiz('options')}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold font-inter hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <List className="w-5 h-5" />
                  {isCompleted(selectedStructure._id) ? 'Riprovo Kuizin - Zgjedh' : 'Fillo Kuizin - Zgjedh'}
                </button>
              </div>

              {isCompleted(selectedStructure._id) && (
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-900 font-semibold font-inter">Kjo temë është përfunduar! Mund ta riprovosh kuizin për të praktikuar ✓</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 font-poppins mb-4">Përmbajtja</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentItems.map((item, index) => {
                const actualIndex = indexOfFirstItem + index;
                return (
                  <div key={actualIndex} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 mb-3 relative">
                      <div className="text-xs font-semibold text-indigo-600 mb-1 font-inter">GJERMANISHT</div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-bold text-gray-900 font-poppins flex-1">{item.german}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(selectedStructure._id, actualIndex, item.german, selectedStructure.level);
                          }}
                          disabled={playingAudio === `${actualIndex}`}
                          className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors disabled:opacity-50"
                          title="Dëgjo shqiptimin"
                        >
                          {playingAudio === `${actualIndex}` ? (
                            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-indigo-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1 font-inter">SHQIP</div>
                      <p className="text-base font-semibold text-gray-800 font-poppins">{item.albanian}</p>
                    </div>
                    {item.example && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 italic font-inter">{item.example}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination for items */}
            {totalItemPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setCurrentItemPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentItemPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-gray-700 font-inter font-medium">
                  Faqja {currentItemPage} nga {totalItemPages}
                </span>
                <button
                  onClick={() => setCurrentItemPage(prev => Math.min(prev + 1, totalItemPages))}
                  disabled={currentItemPage === totalItemPages}
                  className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Quiz View */}
        {selectedStructure && showQuiz && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setShowQuiz(false)}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 font-inter"
            >
              <ChevronLeft className="w-5 h-5" />
              Kthehu te përmbajtja
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                {quizMode === 'write' ? <Edit3 className="w-8 h-8 text-indigo-600" /> : <List className="w-8 h-8 text-purple-600" />}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-poppins">Kuizi: {selectedStructure.title}</h2>
                  <p className="text-gray-600 font-inter mt-1">
                    {quizMode === 'write' ? 'Shkruaj fjalën në gjermanisht' : 'Zgjedh përgjigjën e saktë'} (Duhet 70% për të kaluar)
                  </p>
                </div>
              </div>
            </div>

            {!quizResult ? (
              <>
                <div className="space-y-6 mb-8">
                  {selectedStructure.items.map((item, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold font-inter flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="bg-purple-100 rounded-lg p-4 mb-4">
                            <div className="text-sm font-semibold text-purple-700 mb-1 font-inter">SHQIP</div>
                            <p className="text-xl font-bold text-purple-900 font-poppins">{item.albanian}</p>
                          </div>

                          {quizMode === 'write' ? (
                            <input
                              type="text"
                              placeholder="Shkruaj përkthimin në gjermanisht..."
                              value={quizAnswers[index] || ''}
                              onChange={(e) => handleQuizAnswer(index, e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-inter"
                            />
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {generateQuizOptions(item.german, selectedStructure.items).map((option, optIndex) => (
                                <button
                                  key={optIndex}
                                  onClick={() => handleQuizAnswer(index, option)}
                                  className={`p-3 rounded-lg border-2 text-left font-inter transition-all ${
                                    quizAnswers[index] === option
                                      ? 'border-indigo-500 bg-indigo-50 font-semibold'
                                      : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg font-poppins hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Dërgo Kuizin
                </button>
              </>
            ) : (
              <div className={`p-10 rounded-2xl text-center ${
                quizResult.success ? 'bg-green-50 border-4 border-green-400' : 'bg-red-50 border-4 border-red-400'
              }`}>
                <div className="text-7xl mb-6">
                  {quizResult.success ? '🎉' : '😔'}
                </div>
                <h3 className={`text-3xl font-bold mb-3 font-poppins ${quizResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {quizResult.message}
                </h3>
                {quizResult.xpAwarded > 0 && (
                  <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-4 mb-6 inline-block">
                    <p className="text-2xl text-amber-900 font-bold font-poppins">
                      +{quizResult.xpAwarded} XP fituar!
                    </p>
                  </div>
                )}
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => {
                      setShowQuiz(false);
                      setQuizAnswers({});
                      setQuizResult(null);
                    }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold font-poppins hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    Riprovo Kuizin
                  </button>
                  <button
                    onClick={() => {
                      setShowQuiz(false);
                      setSelectedStructure(null);
                      fetchStructures();
                    }}
                    className="px-8 py-3 bg-gray-600 text-white rounded-xl font-bold font-poppins hover:bg-gray-700 transition-all shadow-lg"
                  >
                    Kthehu te Temat
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Structure;