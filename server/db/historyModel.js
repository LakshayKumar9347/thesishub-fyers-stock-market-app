const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  name: String,
  data: Object,
  timestamp: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

module.exports = History;
