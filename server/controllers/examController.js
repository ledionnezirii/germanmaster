const { Exam, UserExamAttempt } = require('../models/Exam');
const User = require('../models/User');

// Get all exams by level
exports.getExamsByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const exams = await Exam.find({ level }).sort({ subLevel: 1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all available exam levels
exports.getAllExamLevels = async (req, res) => {
  try {
    const exams = await Exam.find().select('level subLevel').sort({ level: 1, subLevel: 1 });
    const grouped = exams.reduce((acc, exam) => {
      if (!acc[exam.level]) acc[exam.level] = [];
      acc[exam.level].push(`${exam.level}.${exam.subLevel}`);
      return acc;
    }, {});
    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get specific exam
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit listening section
exports.submitListening = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === exam.listeningQuestions[index].correctAnswer) {
        correctCount++;
      }
    });
    
    const score = (correctCount / exam.listeningQuestions.length) * 100;
    
    res.json({ 
      success: true, 
      data: { 
        score, 
        correctCount, 
        total: exam.listeningQuestions.length 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit writing section
exports.submitWriting = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    let correctCount = 0;
    answers.forEach((answer, index) => {
      const correctAnswer = exam.writingQuestions[index].correctAnswer.toLowerCase().trim();
      const userAnswer = answer.toLowerCase().trim();
      
      // Calculate similarity (simple word match)
      const correctWords = correctAnswer.split(' ');
      const userWords = userAnswer.split(' ');
      const matchedWords = userWords.filter(word => correctWords.includes(word));
      const similarity = matchedWords.length / correctWords.length;
      
      if (similarity >= 0.8) { // 80% word match
        correctCount++;
      }
    });
    
    const score = (correctCount / exam.writingQuestions.length) * 100;
    
    res.json({ 
      success: true, 
      data: { 
        score, 
        correctCount, 
        total: exam.writingQuestions.length 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit reading section
exports.submitReading = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === exam.readingQuestions[index].correctAnswer) {
        correctCount++;
      }
    });
    
    const score = (correctCount / exam.readingQuestions.length) * 100;
    
    res.json({ 
      success: true, 
      data: { 
        score, 
        correctCount, 
        total: exam.readingQuestions.length 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit complete exam
exports.submitCompleteExam = async (req, res) => {
  try {
    const { examId, listeningAnswers, writingAnswers, readingAnswers, listeningScore, writingScore, readingScore } = req.body;
    const userId = req.user.id;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    const totalScore = Math.round((listeningScore + writingScore + readingScore) / 3);
    const passed = totalScore >= exam.passingScore;
    const xpEarned = passed ? exam.totalXp : Math.round(exam.totalXp * 0.5);
    
    // Save attempt
    const attempt = new UserExamAttempt({
      userId,
      examId,
      listeningScore,
      writingScore,
      readingScore,
      totalScore,
      listeningAnswers,
      writingAnswers,
      readingAnswers,
      passed,
      xpEarned
    });
    
    await attempt.save();
    
    // Update user
    const user = await User.findById(userId);
    user.xp = (user.xp || 0) + xpEarned;
    
    if (passed) {
      user.examsFinished = (user.examsFinished || 0) + 1;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      data: { 
        totalScore, 
        passed, 
        xpEarned,
        attempt 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user exam history
exports.getUserExamHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await UserExamAttempt.find({ userId })
      .populate('examId')
      .sort({ completedAt: -1 });
    
    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create exam (admin)
exports.createExam = async (req, res) => {
  try {
    const exam = new Exam(req.body);
    await exam.save();
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};