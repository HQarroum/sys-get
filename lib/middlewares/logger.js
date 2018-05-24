const chalk = require('chalk');

/**
 * @return a colored version of the given `code`.
 * @param {*} code the code to color.
 */
const color = (code) => {
  const type = Math.floor(code / 100);

  if (type === 4) {
    return (chalk.yellow(code));
  } else if (type === 5) {
    return (chalk.red(code));
  } else {
    return (chalk.green(code));
  }
};

/**
 * `send` function which logs the request
 * and the response.
 * @param {*} req the Expressify request.
 * @param {*} res the Expressify response.
 * @param {*} send_ original `.send` method.
 */
const send = (req, res, send_) => (code, payload) => {
  if (typeof code === 'object') {
    payload = code;
    code = 200;
  }
  // Logging the request and the response code.
  console.log(`[*] ${color(code)} - '${req.method}' - '${req.resource}' with payload '${JSON.stringify(req.payload)}'`);
  // Calling the original `.send` method.
  send_.call(res, code, payload);
};

/**
 * Expressify logging middleware.
 * @param {*} req the Expressify request.
 * @param {*} res the Expressify response.
 * @param {*} next callback involing the next middleware.
 */
module.exports = (req, res, next) => {
  const original = res.send;
  res.send = send(req, res, original);
  next();
};