var express = require('express');
var app = express();
var winston = require('winston');

var config = require('./config');
var getStreamersData = require('./static-data-handler');
var outReqLimiter = require('./outbound-reqs-limiter');

if (!config.serveStaticData) {

  var request = require('request');
  var mongoose = require('mongoose');

  mongoose.connect(config.db.mongoUri, function(err) {
    if(err) config.serveStaticData = true;
  });

  var APIData = require('./data-model.js');
  var reqOptions = {
    method: 'GET',
    headers : {
      'Accept' : 'application/vnd.twitchtv.v3+json',
      'Client-ID' : config.twitchCID
    }
  };
}

winston.level = config.logLevel;

app.enable('trust proxy');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/twitch-api/*?',  function(req, res, next) {

  if(config.serveStaticData) return next('route');

  var APIquery = req.params[0];
  if(!APIquery) return next();
  var params = APIquery.split('/').filter(p => Boolean(p));
  if(params.length < 2 || config.acceptedRoutes.indexOf(params[0]) === -1) {
    winston.log('info', ">> " + APIquery + " - " + req.headers.referer  + '" - ' + req.ip );
    return next({error: 'forbidden', status: 403, msg: 'unaccepted route - see ' + config.host + ' for infos'});
  }

  if(outReqLimiter(winston.log)) return next();
  APIData.findOne({query: APIquery}, function(err, dbCache){
    // if data is cached return it
    if(err) return next(err);
    if(dbCache) {
      winston.log('info', APIquery + ' - cached - "' + req.headers.referer  + '" - ' + req.ip );
      if(req.query.callback){
        res.jsonp(JSON.parse(dbCache.data));
      } else {
        var data = JSON.parse(dbCache.data);
        res.json(data);
      }
    } else {
      // get data from twitch api, store and serve it

      if(outReqLimiter(winston.log)) return next();
      reqOptions.url='https://api.twitch.tv/kraken/' + APIquery;
      request(reqOptions, function(err, response, body){
        if(err) return next(err);
        winston.log('info', APIquery + ' - new - "' + req.headers.referer  + '" - ' + req.ip);
        var d = new APIData({
          query: APIquery,
          data: body,
          ip: req.ip,
          referer : req.headers.referer
        });

        if(outReqLimiter(winston.log)) return next();
        d.save(function(err){
          if(err) return next(err);
          if(req.query.callback){
            res.jsonp(JSON.parse(body));
          } else {
            res.status(response.statusCode).json(JSON.parse(body));
          }
        });
      });
    }
  })
});

app.get('/twitch-api/:type/:name',  function(req, res, next) {
  var APIquery = req.params.type + '/' + req.params.name;
  winston.log('info', APIquery + ' - fake - "' + req.headers.referer  + '" - ' + req.ip );

  var data = getStreamersData(req.params.type, req.params.name);

  if(data) {
    if(req.query.callback) {
      res.jsonp(data)
    } else {
      res.json(data);
    }
  } else {
    next();
  }
});

app.use(function(req, res){
  if(req.query.callback) {
    res.jsonp({status: 404, error: 'not found'});
  } else {
    res.status(404).json({status: 404, error: 'not found'});
  }
});

app.use(function(err, req, res, next){
  winston.log('warn', '>> ERROR ', err.msg);
  if(req.query.callback) {
    res.jsonp({status: err.status || 500, message: err.msg, error: err.error || 'server error' });
  } else {
    res.status(err.status || 500).json({status: err.status || 500, message: err.msg, error: err.error || 'server error' });
  }
})

app.listen(config.port, function () {
  console.log('Your app is listening on port ' + config.port);
});
