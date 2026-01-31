const Structure = require('../models/Structure');
const User = require('../models/User');

// Get all structures (optionally filter by level)
exports.getAllStructures = async (req, res) => {
  try {
    const { level, type } = req.query;
    let filter = {};
    
    if (level) filter.level = level;
    if (type) filter.type = type;
    
    const structures = await Structure.find(filter).sort({ level: 1, type: 1 });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single structure by ID
exports.getStructureById = async (req, res) => {
  try {
    const structure = await Structure.findById(req.params.id);
    if (!structure) {
      return res.status(404).json({ message: 'Structure not found' });
    }
    res.json(structure);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new structure
exports.createStructure = async (req, res) => {
  try {
    const { title, description, level, type, xp, items } = req.body;
    
    const structure = new Structure({
      title,
      description,
      level,
      type,
      xp,
      items
    });
    
    await structure.save();
    res.status(201).json(structure);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update structure
exports.updateStructure = async (req, res) => {
  try {
    const structure = await Structure.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!structure) {
      return res.status(404).json({ message: 'Structure not found' });
    }
    
    res.json(structure);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete structure
exports.deleteStructure = async (req, res) => {
  try {
    const structure = await Structure.findByIdAndDelete(req.params.id);
    
    if (!structure) {
      return res.status(404).json({ message: 'Structure not found' });
    }
    
    res.json({ message: 'Structure deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit quiz and update user progress
exports.submitQuiz = async (req, res) => {
  try {
    const { structureId, score } = req.body;
    const userId = req.user.id; // Assuming you have auth middleware
    
    const structure = await Structure.findById(structureId);
    if (!structure) {
      return res.status(404).json({ message: 'Structure not found' });
    }
    
    // Check if score is 70% or above
    if (score >= 70) {
      const user = await User.findById(userId);
      
      // Check if structure already completed
      if (!user.completedStructures.includes(structureId)) {
        // Add XP
        user.xp += structure.xp;
        
        // Mark structure as completed
        user.completedStructures.push(structureId);
        
        await user.save();
        
        return res.json({
          success: true,
          message: 'Quiz passed! XP awarded.',
          xpAwarded: structure.xp,
          totalXp: user.xp,
          completed: true
        });
      } else {
        return res.json({
          success: true,
          message: 'Quiz passed, but already completed before.',
          xpAwarded: 0,
          totalXp: user.xp,
          completed: true
        });
      }
    } else {
      return res.json({
        success: false,
        message: 'Quiz failed. You need 70% to pass.',
        xpAwarded: 0,
        completed: false
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's completed structures
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('completedStructures');
    
    res.json({
      completedStructures: user.completedStructures || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};