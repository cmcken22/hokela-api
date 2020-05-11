const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'IN_REVIEW'
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
  last_modified_date: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  updated_by: {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
  },
}, { versionKey: false });

module.exports = mongoose.model('Cause', causeSchema);
