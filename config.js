
// if(process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
//   require('dotenv').config();
//}

var self = module.exports = {
  serveStaticData : process.env.STATIC_DATA === 'true',
  twitchCID : process.env.TWITCH_CLIENT_ID,
  port: parseInt(process.env.PORT) || 3000,
  host : 'https://wind-bow.hyperdev.space/',
  logLevel : process.env.LOG_LEVEL || 'info',
  acceptedRoutes : ['streams', 'users', 'channels'],
  db : {
    mongoUri : process.env.MONGO_URI,
    dataExpirationSecs: parseInt(process.env.DBITEM_EXPIRATON_SECS) || 3600,
  },
  outboundReqsLimiter : {
    active : process.env.OBR_LIMIT === 'true',
    checkIntervalMs : parseInt(process.env.OBR_INTERVAL) || 15000,
    maxOBReqsPerInterval : parseInt(process.env.OBR_MAX) || 58
  }
}
