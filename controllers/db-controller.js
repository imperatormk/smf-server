var exports = {};
var express = require('express');

var User = require('../models/user.js');

var Fight = require('../models/fight.js');
var Party = require('../models/party.js');
var FightVote = require('../models/fight-vote.js');

var Comment = require('../models/comment.js');
var CommentVote = require('../models/comment-vote.js');

exports.getFights = function(config) {
	console.log(config);
	var lastId = (config.lastId && config.lastId >=0) ? config.lastId : 5000000;

	var filterObj = { 
    	"categories._id": (config.categories && config.categories.length > 0 ? { $in: config.categories.map(x => x._id) }  : null),
    	"tags.tagText": (config.tags && config.tags.length > 0 ? { $in: config.tags.map(x => x.tagText) }  : null),
    	_id: { $lt: lastId }
    };

	var filterObjNew = {};
    for(var prop in filterObj) {
        if(filterObj[prop] !== null)
            filterObjNew[prop] = filterObj[prop];
    }

    return Fight
        .find(filterObjNew)
		.sort({ _id:-1 })
		.limit(config.count || 900)
        .exec();	
};

exports.endFights = function() { // leave it here just in case
	return Fight.find({shouldExpire: true})
	.then((fights) => {
    
    	fights.forEach((fight) => {
        	console.log(fight._id);
        });
    	return fights;
    });
}

exports.endFight = function(data) {
	return Fight.findById(data.fightId)
	.then((fight) => {
    	fight.calculateWinner();
    
    	return fight.save()
        .then(() => {
        	return fight;
        });;
    });
}

exports.postFight = function(fight) {
	return Fight.create(fight);
}

exports.postComment = function(comm) {
    return Fight.findById(comm.fightId)
	.then((fight) => {
        var commObj = new Comment(comm);
    
    	fight.comments.unshift(commObj);
       	fight.markModified('comments');
    
    	return commObj.save().
        then(() => {
        	fight.save();
        	return commObj;
        });
    });
};

exports.voteOnFight = function(data) {
	return Fight.findById(data.fightId)
	.then((fight) => {
    	if (fight.status !== 1) {
        	return Promise.reject({ msg: 'This fight can\'t be voted on'});
        }
    
    	var party = fight.parties.id(data.partyId);
    	var voteObj = new FightVote(data.content);
    
    	party.votes.push(voteObj);
    	party.markModified('votes');
    
    	return party.save()
        .then(() => {
        	fight.markModified('parties');
        	fight.save();
        	return voteObj;
        });
    });
}
                 
exports.deleteAllFights = function() {
	return Fight.remove({}).exec();
}

/* USERS */

exports.insertUser = function(user) {
	user.gender = 'x';
	return User.create(user);
}

exports.getUsers = function() {
	return User.find({}).exec();
}

exports.getUser = function(data) {
	return User.findOne({ username: data.username }).exec();
}

exports.deleteUsers = function() {
	return User.remove({}).exec();
}

exports.getUserStats = function(config) {
	var filterUserFight = { "posterUser.id": (config.userId && config.userId >= 0 ? { $eq: config.userId } : null) };
	var filterUserComment = { "comments.posterUser.id": (config.userId && config.userId >= 0 ? { $eq: config.userId } : null), "comments.0": { "$exists": true } };
	var filterUserPartyVote = { "parties.votes.voter.id": (config.userId && config.userId >= 0 ? { $eq: config.userId } : null), "parties.votes.0": { "$exists": true } };

	var filterUserFightNew = {};
    for(var prop in filterUserFight) {
        if(filterUserFight[prop] !== null)
            filterUserFightNew[prop] = filterUserFight[prop];
    }

	var filterUserCommentNew = {};
    for(var prop in filterUserComment) {
        if(filterUserComment[prop] !== null)
            filterUserCommentNew[prop] = filterUserComment[prop];
    }

	var filterUserPartyVoteNew = {};
    for(var prop in filterUserPartyVote) {
        if(filterUserPartyVote[prop] !== null)
            filterUserPartyVoteNew[prop] = filterUserPartyVote[prop];
    }

	console.log(filterUserPartyVoteNew);

	var promiseArr = [];
	var actTypes = config.actTypes;
	var hasTypes = actTypes && actTypes.length > 0;
	
	if (!hasTypes || actTypes.includes('fights')) {
    	var fightsStat = Fight.find(filterUserFightNew)
    	.select('title posterUser datePosted')
    	.exec();
    
    	promiseArr.push(fightsStat);
    }

	if (!hasTypes || actTypes.includes('comments')) {
    	var commentsStat = Fight.find(filterUserCommentNew)
    	.select('comments.fightId comments.posterUser comments.datePosted')
    	.exec();
    
    	promiseArr.push(commentsStat);
    }

	if (!hasTypes || actTypes.includes('votes')) {
    	var votesStat = Fight.find(filterUserPartyVoteNew)
    	.select('parties.votes.dateVoted parties.votes.voter')
    	.exec();
    
    	promiseArr.push(votesStat);
    }

	return Promise.all(promiseArr);
}

exports.getProfile = function(data) {
	var userId = data.userId;
	if (userId) {
        return User.findById(userId).lean()
    	.then((user) => {
        	delete user.password;
        	delete user.permissions;
        	delete user.role;
        	// move these in a separate getter + model
        	return user;
        });
    }
	return Promise.reject({});
}

module.exports = exports;
