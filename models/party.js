var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var FightVoteSchema = require('./fight-vote');

var PartySchema = new mongoose.Schema({
	name: {
    	type: String,
    	required: true,
    	default: ''
    },
	votes: [FightVoteSchema.schema]
});

autoIncrement.initialize(mongoose.connection);
PartySchema.plugin(autoIncrement.plugin, {
	model: 'Party',
	startAt: 1
});

module.exports = mongoose.model('Party', PartySchema);
