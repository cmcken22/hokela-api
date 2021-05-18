const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  cause_id: {
    type: String,
    required: true,
  },
  location_id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
  },
  age: {
    type: Number,
  },
  status: {
    type: String,
    required: true,
    default: 'PENDING'
  },
  created_date: {
    type: Date,
    default: Date.now,
  }
}, { versionKey: false });

module.exports = mongoose.model('Application', applicationSchema);
