const Pty      = require('../pty/pty-local');
const commands = require('../commands');

/**
 * Loads the system information associated with the
 * given array of topics.
 * @param {*} list the array of topics to display information
 * about. If the array is empty, information on all the commands
 * will be returned.
 */
const loadInformation = function (list) {
  const array = [];

  list.forEach((command) => {
    const provider = require(`../components/${command}`);
    if (provider.get) {
      array.push(provider.get().then((res) => ({ res, command })));
    }
  });

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
    this.commands = commands();
    // Creating a pty.
    this.pty_ = new Pty();
    // Intervals.
    this.intervals = [];
    // Interval refresh rate.
    this.rate = this.program.refreshRate || 4 * 1000;
  }

  /**
   * Prepares the current agent.
   * @return a promise resolved when the agent
   * is ready.
   */
  prepare() {
    return (Promise.resolve());
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
   * Subscribes to a given topic.
   * @param {*} topic the topic to subscribe to.
   * @param {*} callback function to be called on an
   * update event on the subscribed topic.
   */
  subscribe(topic, callback) {
    this.intervals.push(
      setInterval(() => {
        this.some([ topic ]).then((result) => {
          callback(topic, result);
        })
      }, this.rate)
    );
  }

  /**
   * Subscribes to many topics.
   * @param {*} array an array of topic.
   * @param {*} callback function to be called on an
   * update event on one of the subscribed topics.
   */
  subscribeMany(array, callback) {
    return (array.map((topic) => subscribe(topic, callback)));
  }

  /**
   * @return a promise resolved when an instance of a PTY
   * has been created.
   */
  pty() {
    return (this.pty_);
  }

  /**
   * Closes any connection opened by the client.
   */
  close() {
    // Clearing all intervals.
    this.intervals.forEach((interval) => clearInterval(interval));
    return (Promise.resolve());
  }
};

module.exports = LocalRetriever;