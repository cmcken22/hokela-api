const mongoose = require('mongoose');

const causeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // locations: {
  //   type: Array,
  //   required: true,
  // },
  event_type: {
    type: String,
    // required: true,
  },
  date: {
    type: String,
    // required: true,
  },
  position_info: {
    type: Object,
    // required: true,
  },
  requirements: {
    type: Object,
    // required: true,
  },
  organization: {
    type: String,
    // required: true,
  },
  organization_info: {
    type: Object
    // required: true,
  },
  impact: {
    type: Object,
    // required: true,
  },
  image_link: {
    type: String,
  },
  logo_link: {
    type: String,
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
      // required: false,
    },
    email: {
      type: String,
      // required: false,
    },
  },
}, { versionKey: false });

module.exports = mongoose.model('Cause', causeSchema);
