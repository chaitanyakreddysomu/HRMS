const ThemeSettings = require('../models/ThemeSettings');

exports.getThemeSettings = async (req, res) => {
  try {
    let theme = await ThemeSettings.findOne();
    if (!theme) {
      theme = await ThemeSettings.create({}); // Create default if it doesn't exist
    }
    res.status(200).json(theme);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theme settings', error: error.message });
  }
};

exports.updateThemeSettings = async (req, res) => {
  try {
    let theme = await ThemeSettings.findOne();
    if (!theme) {
      theme = await ThemeSettings.create(req.body);
    } else {
      theme = await ThemeSettings.findOneAndUpdate({}, req.body, { returnDocument: 'after' });
    }
    res.status(200).json(theme);
  } catch (error) {
    res.status(500).json({ message: 'Error updating theme settings', error: error.message });
  }
};
