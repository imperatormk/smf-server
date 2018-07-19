var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var uniqueValidator = require('mongoose-unique-validator');
var bcrypt = require('bcrypt');

var UserRole = require('../models/user-role');
var UserSummary = require('../models/user-summary');

var UserSchema = new mongoose.Schema({
	username: {
    	type: String,
    	unique: true,
    	required: true
    },
	password: {
    	type: String,
    	required: true
    },
	role: {
    	type: UserRole.schema,
    	required: true
    },
	permissions: {
    	type: [String]
    },
	thumbnailUrl: String,
	email: {
    	type: String,
    	unique: true,
    	required: true
    },
	gender: {
    	type: String,
    	required: true
    },
	dateOfBirth: {
    	type: Date,
    	required: true
    },
	memberSince: {
    	type: Date,
    	default: Date.now
    }
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});
 
UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

UserSchema.methods.getSummary = function(cb) {
	var summary = {
    	id: this._id,
    	username: this.username,
    	thumbnailUrl: this.thumbnailUrl
    };
	var role = this.role;
	var permissions = this.permissions;

	var userObj = {
    	summary,
    	role,
    	permissions
    }

	cb(userObj);
}

autoIncrement.initialize(mongoose.connection);
UserSchema.plugin(autoIncrement.plugin, {
	model: 'User',
	startAt: 1
});
UserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', UserSchema);