var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')
var uniqueValidator = require('mongoose-unique-validator')

var UserSummarySchema = require('./user-summary')
var CommentSchema = require('./comment')
var CategorySchema = require('./category')
var PartySchema = require('./party')
var moment = require('moment')

var FightSchema = new mongoose.Schema({
	posterUser: {
        type: UserSummarySchema.schema,
        required: true,
    	_id: false
    },
	title: {
    	type: String,
    	required: true
    },
	description: {
    	type: String,
    	required: true,
    	minLength: 5
    },
	categories: {
    	type: [CategorySchema.schema],
    	required: true
    },
	datePosted: {
    	type : Date,
    	default : Date.now
    },
	endDays: {
    	type: Number,
    	default: 2
    },
	imageURL: String,
	status: {
    	type: Number,
    	default: 1
    },
	winnerParties: {
    	type: [Number]
    },
	parties: {
    	type: [PartySchema.schema],
    	required: true
    },
	comments: [CommentSchema.schema],
	tags: [{
    	tagText: {
    		type: String,
    		required: true
    	},
    	_id: false
    }]
}, { usePushEach: true })

autoIncrement.initialize(mongoose.connection)
FightSchema.plugin(autoIncrement.plugin, {
	model: 'Fight',
	startAt: 1
})
FightSchema.plugin(uniqueValidator)

FightSchema.methods.getFightVotes = function() {
    var votesArr = []

	this.parties.forEach((party) => {
    	party.votes.forEach((vote) => {
        	var voteObj = vote.toObject()
        	voteObj.fightId = this._id
        	votesArr.push({
    			actType: 'vote',
    			actObj: voteObj
    		})
		})
	})

	return votesArr
}

FightSchema.methods.getFightComments = function() {
    var commArr = []

	this.comments.forEach((comment) => {
    	var commObj = comment.toObject()
        commObj.fightId = this._id
    	commArr.push({
    		actType: 'comment',
    		actObj: commObj
    	})
	})

	return commArr
}

FightSchema.methods.getFight = function() {
	var fight = this.toObject()
	return {
    	actType: 'fight',
    	actObj: fight
    }
}

FightSchema.virtual('shouldExpire').get(function () {
	if (this.status == 2) return false

	var postDate = this.datePosted
	var endDays = this.endDays

	var endDate = moment(postDate).add(endDays, 'days')

	return moment().isSameOrAfter(endDate)
})

FightSchema.methods.getEndDate = function() {
	var postDate = this.datePosted
	var endDays = this.endDays

	var endDate = moment(postDate).add(endDays, 'days')

	return endDate
}

FightSchema.methods.calculateWinner = function() {
	this.status = 2
	var countArr = []

	this.parties.forEach(function(party) {
    	var curVotes = party.votes.length
    	if (curVotes > 0) {
        	countArr.push({ id: party._id, voteCount: curVotes })
        }
    })

	this.winnerParties = getMaxIndexes(countArr, 'voteCount')
}

function getMaxIndexes(arr, propName) {
  var max = 0, indices = []
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i][propName] < max) continue
    if (arr[i][propName] > max) {
      indices = []
      max = arr[i][propName]
    }
    indices.push(arr[i]['id'])
  }

  return indices
}

module.exports = mongoose.model('Fight', FightSchema)
