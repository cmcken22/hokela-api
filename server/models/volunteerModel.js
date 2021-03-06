const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  cause_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'PENDING'
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
      // required: true,
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

module.exports = mongoose.model('Volunteer', volunteerSchema);
