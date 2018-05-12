const fs = require('fs');

/**
 * Loads the system information associated with the
 * given array of topics.
 * @param {*} list the array of topics to display information
 * about. If the array is empty, information on all the commands
 * will be returned.
 */
const loadInformation = function (list) {
  const array = [];

  // Loads commands in an array of promises.
  const load = (cmds) => {
    cmds.forEach((command) => {
      if (this.commands.indexOf(command) < 0) return;
      const provider = require(`../${command}`);
      if (provider.get) {
        array.push(provider.get().then((res) => ({ res, command })));
      }
    });
  };

  load(list);

  // If no commands were found, we stop.
  if (!array.length) load(this.commands);

  // Displaying the gathered information.
  return Promise.all(array);
};

/**
 * Local system information retriever class.
 */
class LocalRetriever {
  
  /**
   * Class constructor.
   * @param {*} program an instance of `commander`. 
   */
  constructor(program) {
    this.program  = program;
    // A list of available commands.
    this.commands = [];
    // Building the `commands` array.
    fs.readdirSync('./lib').forEach((file) => {
      if (file.endsWith('.js')) {
        this.commands.push(file.replace(/\.[^/.]+$/, ''));
      }
    });
  }

  /**
   * @return an array of system information objects on all
   * the components of the system.
   */
  all() {
    return (loadInformation.call(this, this.commands));
  }

  /**
   * @return an array of system information objects on the
   * components of the system associated with the given `array`.
   */
  some(array) {
    return (loadInformation.call(this, array));
  }

  /**
   * @return a promise resolved when an instance of a PTY
   * has been created.
   */
  pty() {

  }
};

module.exports = LocalRetriever;