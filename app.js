var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require("http");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Added by Harris
app.get('/api', function(req, res, next) {

  var el = req.query.bay;

  var options = {
    host: '10.44.14.61',
    port: 1880,
    path: '/reserve?bay=' + el,
    method: 'GET'
  };

  http.request(options, function(resHttp) {
    resHttp.setEncoding('utf8');
    resHttp.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  }).end();

//  res.send('respond with a resource');
  res.json({status: "Yahoo!"});
});

app.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/public/test21.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
