var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var UserSummarySchema = require('./user-summary');

var CommentVoteSchema = new mongoose.Schema({
	voterUser: {
    	type: UserSummarySchema.schema,
    	required: true
    },
	value: {
    	type: Number,
    	required: true
    },
	dateVoted: {
    	type: Date,
    	default: Date.now
    }
});

CommentVoteSchema.method('isThumbsup', function () {
    return this.value > 0;
});

CommentVoteSchema.method('isThumbsdown', function () {
    return this.value < 0;
});

autoIncrement.initialize(mongoose.connection);
CommentVoteSchema.plugin(autoIncrement.plugin, {
	model: 'CommentVote',
	startAt: 1
});

module.exports = mongoose.model('CommentVote', CommentVoteSchema);
