const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  moduleType: {
    type: String,
    required: true,
    default: 'BC Module'
  },
  rackId: {
    type: String,
    required: true
  },
  shelfId: {
    type: Number,
    required: true
  },
  position: {
    type: String,
    enum: ['front', 'rear'],
    required: true
  },
  fileTag: {
    type: String,
    required: true
  },

  accountNumbers: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Add index on accountNumbers to speed up searches
RecordSchema.index({ accountNumbers: 1 });

module.exports = mongoose.model('Record', RecordSchema);
