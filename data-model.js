
var mongoose = require('mongoose');
var ets = require('./config').db.dataExpirationSecs;

var Schema = mongoose.Schema;
var DataSchema = new Schema({
  query: {type: String, index: true},
  data: String,
  ip: String,
  referer: String,
  createdAt: { type: Date, expires: ets, default: Date.now }
});

module.exports = mongoose.model('APIData', DataSchema);