var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var CategorySchema = new mongoose.Schema({
	name: {
    	type: String,
    	required: true
    },
	thumbnailUrl: String
});

autoIncrement.initialize(mongoose.connection);
CategorySchema.plugin(autoIncrement.plugin, {
	model: 'Category',
	startAt: 1
});

module.exports = mongoose.model('Category', CategorySchema);