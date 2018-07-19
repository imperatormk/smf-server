var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var UserSummarySchema = require('./user-summary');
var CommentVoteSchema = require('./comment-vote');

var CommentSchema = new mongoose.Schema({
	content: {
    	type: String,
    	required: true
    },
	posterUser: UserSummarySchema.schema,
	fightId: {
    	type: Number,
    	required: true
    },
	datePosted: {
    	type: Date,
    	default: Date.now
    },
	votes: [CommentVoteSchema.schema],
	totalPoints: {
    	type: Number,
    	default: 0
    }
}, { usePushEach: true });

CommentSchema.methods.addPoint = function () {
    this.totalPoints++;
};

CommentSchema.methods.removePoint = function () {
    this.totalPoints--;
};

CommentSchema.methods.addVote = function(commentVote) {
	if (commentVote.isThumbsup()) this.addPoint();
	if (commentVote.isThumbsdown()) this.removePoint();
	this.votes.push(commentVote);
}

CommentSchema.methods.removeVote = function(commentVote) {
	if (commentVote.isThumbsup()) this.removePoint();
	if (commentVote.isThumbsdown()) this.addPoint();
	this.votes.pull(commentVote);
}

autoIncrement.initialize(mongoose.connection);
CommentSchema.plugin(autoIncrement.plugin, {
	model: 'Comment',
	startAt: 1
});

module.exports = mongoose.model('Comment', CommentSchema);