
var config = require('./config').outboundReqsLimiter

var outReqCounter = {tstamp: Date.now(), req: 0};
var outReqLimiter = function(logger) {
  logger = logger || console.log;
  if(!config.active) return false;
  var now = Date.now();
  if ((now - outReqCounter.tstamp) <= config.checkIntervalMs) {
    outReqCounter.req++;
  } else {
    outReqCounter = {tstamp: Date.now(), req: 1};
  }
  var elapsed = now - outReqCounter.tstamp;
  logger('info', '* ob rate - reqs: ' + outReqCounter.req + ' / ms: ' + elapsed);
  if(outReqCounter.req >= config.maxOBReqsPerInterval) {
      logger('warn', 'OUTBOUND RATE LIMITER ON !!!');
      return true;
  }
  return false;
};

module.exports = outReqLimiter;
