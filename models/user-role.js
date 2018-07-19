var mongoose = require('mongoose');

var UserRoleSchema = new mongoose.Schema({
   	bitMask: {
    	type: Number,
    	required: true
    },
	title: {
    	type: String,
    	required: true
    },
}, { _id : false });

module.exports = mongoose.model('UserRole', UserRoleSchema);