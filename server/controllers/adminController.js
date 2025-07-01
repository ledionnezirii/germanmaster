const mongoose = require('mongoose');
const User = require('../models/User');  // Ose cilado që është modeli i përdoruesve

// Funksioni për përditësimin e statusit të adminit
exports.updateAdminStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId, // ID-ja e përdoruesit që do të bëhet admin
      { role: 'admin' }, // Përditësojmë rolin në admin
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Përdoruesi nuk u gjet.' });
    }

    res.status(200).json({ message: 'Përdoruesi është bërë admin', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ka ndodhur një gabim.' });
  }
};

