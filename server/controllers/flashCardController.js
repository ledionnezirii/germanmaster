// controllers/flashCardController.js
const FlashCard = require('../models/FlashCard');

// Get all flashcards
exports.getAllFlashCards = async (req, res) => {
  try {
    const flashcards = await FlashCard.find();
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get flashcard by ID
exports.getFlashCardById = async (req, res) => {
  try {
    const flashcard = await FlashCard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    res.json(flashcard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new flashcard
exports.createFlashCard = async (req, res) => {
  const flashcard = new FlashCard({
    german_word: req.body.german_word,
    translation: req.body.translation,
    difficulty: req.body.difficulty,
    xp_value: req.body.xp_value,
    category: req.body.category
  });

  try {
    const newFlashCard = await flashcard.save();
    res.status(201).json(newFlashCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update flashcard
exports.updateFlashCard = async (req, res) => {
  try {
    const flashcard = await FlashCard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    Object.assign(flashcard, req.body);
    const updatedFlashCard = await flashcard.save();
    res.json(updatedFlashCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete flashcard
exports.deleteFlashCard = async (req, res) => {
  try {
    const flashcard = await FlashCard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    await flashcard.deleteOne();
    res.json({ message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add XP to user
exports.addXP = async (req, res) => {
  try {
    const { userId, xpEarned } = req.body;
    
    // Assuming you have a User model
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.total_xp += xpEarned;
    
    // Level calculation: every 100 XP = 1 level
    user.current_level = Math.floor(user.total_xp / 100) + 1;
    
    await user.save();
    res.json({ 
      total_xp: user.total_xp, 
      current_level: user.current_level 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};