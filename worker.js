var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');

var mongoose = require('mongoose');
var dbConfig = require('./config/database.js');
var helmet = require('helmet');
var cors = require('cors');

var dbController = require('./controllers/db-controller.js');

var Agenda = require('agenda');

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    var environment = this.options.environment;

	var opts = {
    	keepAlive: 1,
		useMongoClient: true
	};
  	let agenda = null;

	mongoose.Promise = global.Promise; // bluebird?
  
	var connection = mongoose.connect(dbConfig.database, opts)
	.then((db) =>  {
    	console.log('MongoDB connection successful');
    	agenda = new Agenda({mongo: db});
    
  		agenda.define('end_fight', function(job, done) { // conc
        	var fightId = job.attrs.data.fightId;
        	agenda.cancel({name: 'end_fight', "data.fightId": fightId}, function(err, numRemoved) { console.log("Removed " + numRemoved + " jobs"); });
        
        	console.log('Ending fight: ', fightId);
			dbController.endFight({ fightId })
        	.then((fight) => {
		      	var chName = 'fight-' + fightId;
		      	scServer.exchange.publish(chName, {
		        	type: 'fightEnded',
		        	content: {
		            	status: fight.status,
                    	winnerParties: fight.winnerParties
		            }
		        });
            	done();
            });
		});
        
    	// agenda.cancel({name: 'end_fights'}, function(err, numRemoved) { console.log(numRemoved); });

		agenda.on('ready', function() {
			// agenda.every('20 seconds', 'end_fights');
			// agenda.start();
		});
    })
	.catch((err) => console.error(err));
  
    var whitelist = ['http://173.212.213.101:4200', 'http://localhost:4200']
	var corsOptions = {
	  origin: function (origin, callback) {
    	if (!origin || whitelist.indexOf(origin) !== -1) {
      	  callback(null, true)
    	} else {
      	  callback(new Error('Not allowed by CORS'))
   	    }
	  },
      optionsSuccessStatus: 200,
      credentials: true
	}

	var app = express();
	app.use(helmet());
	app.use(cors(corsOptions));
  
  	var userSummary = {
		id: 1,
		username: 'imperatormk'
	}
  
  	app.get('/backend/me', function(req, res) {
    	var userObj = {
	        success: true,
	        user: {
	        	summary: userSummary,
	        	role: {
	            	bitMask: 2,
	            	name: 'admin'
	            },
	        	permissions: 
            	['postFight',
                 'postComment',
                 'voteOnFight',
                 'voteOnComment']
	        }
        }
        res.json(userObj);
    });

    var httpServer = this.httpServer;
    var scServer = this.scServer;

    if (environment === 'dev') {
      // Log every HTTP request. See https://github.com/expressjs/morgan for other
      // available formats.
      app.use(morgan('dev'));
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Add GET /health-check express route
    healthChecker.attach(this, app);

    httpServer.on('request', app);
  
  	scServer.addMiddleware(scServer.MIDDLEWARE_EMIT,
  	  function (req, next) {
        if (true) {
          if (req.event === 'postFight') {
          	if (req.socket.authToken) {
            	var user = req.socket.authToken.summary;
            	req.data.posterUser = user;
            	next();
            } else {
            	var err = new Error('Not allowed to post a fight');
            	next(err);
            }
          } else {
          	next();
          }
        } else {
          var err = new Error(req.socket.id + ' is not allowed to emit event ' + req.event);
          next(err);
        }
      }
    );
  
  	app.get('/api/categories', function(req, res, next) {
    	res.json([
        {
        	_id: 1,
        	name: 'All'
        },
        {
        	_id: 2,
        	name: 'Work'
        },
        {
        	_id: 3,
        	name: 'Love'
        }
        ]);
    	next();
    });
  
    scServer.on('connection', function (socket) {
       
      socket.on('getUsers', function() {
      	dbController.getUsers()
      	.then(users => {
        	socket.emit('userList', users);
        })
      	.catch(err => {
        	console.log(err);
        });
      });
    
      socket.on('deleteUsers', function(data) {
      	dbController.deleteUsers()
      	.then(data => {
        	console.log(data);
        })
      	.catch(err => {
        	console.log(err);
        });
      });
    
      socket.on('regUser', function(data) {
      	dbController.insertUser(data)
      	.then(user => {
        	socket.emit('regUserDone', user);
        })
      	.catch(err => {
        	console.log(err);
        });
      });
    
      socket.on('reqStats', function (data) {
      	dbController.getUserStats(data)
		.then(stats => {
        	var statNames = ['fights', 'comments', 'votes'];
        	var statsArr = [];
        
        	for (var i=0; i<stats.length;i++) {
            	if (i==2) {
                	for (var j=0;j<stats[i].length;j++) {
                    	var votes = stats[i][j].getFightVotes();
                    	votes.forEach(function(vote) {
                        	statsArr.push(vote);
                        });
                    }
                } else if (i==1) {
                	for (var j=0;j<stats[i].length;j++) {
                    	var comments = stats[i][j].getFightComments();
                    	comments.forEach(function(comm) {
                        	statsArr.push(comm);
                        });
                    }
                } else if (i==0) {
                	for (var j=0;j<stats[i].length;j++) {
                    	var fight = stats[i][j].getFight();
                    	statsArr.push(fight);
                    }
                }
            }
                
        	socket.emit('getStats', statsArr);
        })
    	.catch(err => {
        	console.log('Error while getting fights: ', err);
        	socket.emit('getStats', {});
        });
      });
    
      socket.on('reqFights', function (data) {
      	dbController.getFights(data)
		.then(fights => {
        	socket.emit('getFights', fights);
        })
    	.catch(err => {
        	console.log('Error while getting fights: ', err);
        	socket.emit('getFights', {});
        });
      });
    
	  socket.on('updateFight', function(data) {
      	var fightId = data._id;
      	var chName = 'fight-' + fightId;
      	scServer.exchange.publish(chName, {
        	type: 'bodyChange',
        	content: {
            	title: data.title
            }
        });
      });

      socket.on('deleteAllFights', function () {
      	agenda.cancel({name: 'end_fight'}, function(err, numRemoved) { console.log("Removed " + numRemoved + " jobs"); });
    	// { 'data.id': 123 }
      	dbController.deleteAllFights();
      });
    
      socket.on('postFight', function (data) {
      	dbController.postFight(data)
		.then(fight => {
        	console.log('Fight created', fight.endDays); // below is temp
        
        	if (agenda) {
        		agenda.schedule('in ' + fight.endDays + ' minutes', 'end_fight', {fightId: fight._id});
  				agenda.start();
            } else {
            	console.log('No agenda...');
            }
        
        	scServer.exchange.publish('postFeed', {
        		type: 'newFight',
        		content: fight
        	});
        
        	scServer.exchange.publish('newActivity', fight.getFight());
        })
    	.catch(err => {
        	console.log(err);
        });
      });
    
      socket.on('postComment', function (data) {
      	dbController.postComment(data)
      	.then(comm => {
        	var fightId = comm.fightId;
      		var chName = 'fight-' + fightId;        
        	scServer.exchange.publish(chName, {
        		type: 'newComment',
        		content: comm
        	});
        });
      });
    
      socket.on('fightVote', function (data) {
      	var fightId = data.fightId;
      	var partyId = data.partyId;
      	dbController.voteOnFight(data)
      	.then(vote => {
        	var chName = 'fight-' + fightId;
        	scServer.exchange.publish(chName, {
            	type: 'fightVote',
            	content: {
                	partyId,
                	vote
                }
            });
        }, err => {
        	console.log(err);
        });
      });
    
      socket.on('reqProfile', function (data) {
      	dbController.getProfile(data)
		.then(userProfile => {
        	socket.emit('getProfile', userProfile);
        })
    	.catch(err => {
        	console.log('Error while getting profile: ', err);
        	socket.emit('getProfile', {});
        });
      });
    
      socket.on('login', function(credentials, respond) {
      	if (socket.authToken) {
        	respond('Already logged in.');
        	return false;
        }
      
      	dbController.getUser(credentials)
      	.then(user => {
        	if (!user) {
            	respond('User not found.');
            	return false;
            }
                
        	user.comparePassword(credentials.password, function(err, isMatch) {
            	if (isMatch && !err) {
                	user.getSummary((summary) => {
                    	socket.setAuthToken(summary);
                    	respond();
                    });
                	return true;
                } else {
                	respond('Invalid password.');
                	return false;
                }
            });
        });
      });
    
      socket.on('logout', function(data, respond) {
      	if (!socket.authToken) {
        	respond('Already logged out.');
        	return false;
        }
      	socket.deauthenticate();
      	respond();
      });
    
    });
  }
}

new Worker();
