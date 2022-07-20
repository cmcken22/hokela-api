const mongoose = require('mongoose');

const toggleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  }
}, { versionKey: false });

module.exports = mongoose.model('Toggle', toggleSchema);
