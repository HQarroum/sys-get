const LocalSystemRetriever = require('./clients/local');
const MqttSystemRetriever  = require('./clients/mqtt');
const IpcSystemRetriever   = require('./clients/ipc');

/**
 * @return a client system retriever interface given
 * the options passed to the application.
 * @param {*} program an instance of `commander`.
 */
module.exports = (program) => {
  if (!program.useExpressify) {
    return new LocalSystemRetriever(program);
  } else if (program.useExpressify === 'mqtt') {
    return new MqttSystemRetriever(program);
  } else if (program.useExpressify === 'ipc') {
    return new IpcSystemRetriever(program);
  }
  throw new Error(`Expressify method ${program.useExpressify} is not supported`);
};