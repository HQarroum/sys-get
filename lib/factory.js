const LocalSystemRetriever      = require('./clients/local');
const ExpressifySystemRetriever = require('./clients/expressify');

/**
 * @return a client system retriever interface given
 * the options passed to the application.
 * @param {*} program an instance of `commander`.
 */
module.exports = (program) => {
  if (!program.useExpressify) {
    return new LocalSystemRetriever(program);
  } else {
    return new ExpressifySystemRetriever(program);
  }
};