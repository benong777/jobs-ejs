const mongoose = require('mongoose');

const JobsSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Please provide company name.'],
    maxlength: 50,
  },
  position: {
    type: String,
    required: [true, 'Please provide position.'],
    maxlength: 100,
  },
  status: {
    type: String,
    enum: ['interview', 'declined', 'pending'],
    default: 'pending',
  },
  createdBy: {
    type: mongoose.Types.ObjectId,  // * Note: ObjectId
    ref: 'User',                    // Tie the job to the user
    required: [true, 'Please provide user.']
  }
},{ timestamps: true });            // Automatically add createdAt and updatedAt properties

module.exports = mongoose.model('Job', JobsSchema);