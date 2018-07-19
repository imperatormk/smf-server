var mongoose = require('mongoose');

var UserSummarySchema = require('./user-summary');

var FightVoteSchema = new mongoose.Schema({
	voter: {
        type: UserSummarySchema.schema,
        required: true,
        _id: false
    },
    dateVoted: {
        type : Date,
        default : Date.now
    },
}, { _id: false });

module.exports = mongoose.model('FightVote', FightVoteSchema);
