
var fs = require('fs');
var streamers = JSON.parse(fs.readFileSync(__dirname + '/streamers.json', {encoding: 'utf-8'}));

function getStreamersData(type, user) {
  if(!streamers[user]) return undefined;
  return streamers[user][type];
}


module.exports = getStreamersData;