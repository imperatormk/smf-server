var mongoose = require('mongoose');

var UserSummarySchema = require('./user-summary');

var FightSummarySchema = new mongoose.Schema({
	fightId: {
    	type: Number,
    	required: true
    },
	posterUser: {
        type: UserSummarySchema.schema,
        required: true,
    	_id: false
    },
	title: {
    	type: String,
    	required: true
    },
	datePosted: {
    	type : Date,
    	default : Date.now
    }
}, { _id : false });

module.exports = mongoose.model('FightSummary', FightSummarySchema);