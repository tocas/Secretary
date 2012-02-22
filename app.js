
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    xml2js = require('xml2js'),
    xmlParser = new xml2js.Parser();
    nodemailer = require('nodemailer');
    

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

var userMap = {
  'Tomas Lucovic': 'tomaslucovic@gmail.com',
  'Jiri Zajpt': 'jzajpt@gmail.com'
};

var tasks = {
  '55555':'tomaslucovic@gmail.com'
};

var database = {
};


app.post('/pt-activity', function(req, res) {
  req.on('data', function(chunk) {
    data = chunk.toString();
    xmlParser.parseString(data, function(err, data) {
      console.log(data.project_id["#"]);
      console.log(data.stories.story.id["#"]);
      var email = userMap[data.author];
      var secret = Math.round(Math.random()*1000000000);
      console.log(email, ' má tajemství ', secret);
      tasks[secret] = email;
      database[email] = data; 
      
      nodemailer.SMTP = {
          host: 'smtp.gmail.com', // required
          port: 587, // optional, defaults to 25 or 465
          use_authentication: true, // optional, false by default
          user: 'tomaslucovic@gmail.com', // used only when use_authentication is true 
          pass: 'pLH9P274iD'  // used only when use_authentication is true
      }
      nodemailer.send_mail(
          // e-mail options
          {
              sender: 'secretery@blueberryapps.com',
              to:'tlucovic@blueberryapps.com',
              subject:'Time!',
              html: '<p>Jak dlouho jste pracoval na úkolu?' + data.description + '</p><br /><p>'+ data.project_id["#"] +'</p><br /><p>'+ data.stories.story.id["#"] +'</p><br /><a href="http://localhost:3001/log-time/'+ secret + '/60">1 hodina</a>'
          },
          // callback function
          function(error, success){
              console.log('Message ' + success ? 'sent' : 'failed');
          }
      );
    });
  });
  res.end();
});

app.get('/log-time/:id/:minutes', function(req, res) {
  console.log(tasks[req.params.id], req.params.minutes);
  var email = tasks[req.params.id];
  
  var request = require('request');
  request.post(
    { url: 'http://localhost:3000/api/create',
      body: '{"day":"2012-02-09","description":"'+ escape(database[email].description) +'","project_id":' + database[email].project_id["#"] +',"story_id":'+database[email].stories.story.id["#"] +',"time":'+req.params.minutes+'}' }, 
    function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body) 
    }
  })
  res.end();
});

app.listen(3001);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
