var mongoose = require('mongoose'),
    jobs = mongoose.connection.collection('jobs'),
    Agenda = require('agenda'),
    noop = function() {};

jobs.ensureIndex({
    nextRunAt: 1, 
    lockedAt: 1, 
    name: 1, 
    priority: 1
}, noop);

var agenda = new Agenda();
var agendaObj = agenda.mongo(jobs);

agendaObj.define('end_fights', function(job, done) {
  console.log('end_fights');
  done();
});

agenda.on('ready', function() {
  agenda.every('2 minutes', 'end_fights');
  agenda.start();
});