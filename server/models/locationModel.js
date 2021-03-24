const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  cause_id: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  province: {
    type: String
  },
  country: {
    type: String,
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

module.exports = mongoose.model('Location', locationSchema);
