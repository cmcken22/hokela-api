const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
  },
  sector: {
    type: String
  },
  area: {
    type: String,
  },
  time_of_day: {
    type: Array
  },
  days: {
    type: Array
  },
  hours: {
    type: String
  },
  duration: {
    type: String
  },
  ages: {
    type: String
  },
  skill: {
    type: String
  },
  other_skills: {
    type: Array
  },
  ideal_for: {
    type: Array
  },
  sections: {
    type: Array,
  },
  image_link: {
    type: String,
  },
  logo_link: {
    type: String,
  },
  contact: {
    type: Object,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE'
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
    },
    email: {
      type: String,
      required: true,
    },
  },
  updated_by: {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
  },
}, { versionKey: false });

module.exports = mongoose.model('Cause', causeSchema);
