var mongoose = require('mongoose');
var UserRole = require('../models/user-role');

var UserSummarySchema = new mongoose.Schema({
   	id: {
    	type: Number,
    	required: true
    },
	username: {
    	type: String,
    	required: true
    },
	thumbnailUrl: String
}, { _id : false });

module.exports = mongoose.model('UserSummary', UserSummarySchema);
