const iot           = require('aws-iot-device-sdk');
const Expressify    = require('expressify');
const IpcStrategy   = require('expressify-ipc');
const MqttStrategy  = require('expressify-mqtt');

// Application dependencies.
const commands      = require('../commands');
const ExpressifyPty = require('../pty/pty-expressify');

/**
 * Initiates an MQTT connection.
 * @param {*} opts the options to pass to the MQTT library.
 */
const connect = (opts) => new Promise((resolve, reject) => {
  const mqtt = iot.device(opts);
  mqtt.on('connect', () => resolve(mqtt));
  mqtt.on('error', (err) => reject(err));
});

/**
 * Destroys an MQTT connection.
 */
const disconnect = function () {
  return new Promise((resolve) => {
    if (this.mqtt) {
      this.mqtt.once('close', () => resolve());
      this.mqtt.end(true);
    }
  });
};

const factory = {

  /**
   * @return a promise resolved when the `ipc` client
   * has been created.
   * @param {*} program an instance of `commander`.
   */
  createipc: function (program) {
    return Promise.resolve(this.client = new Expressify.Client({
      strategy: new IpcStrategy({
        endpoint: program.endpoint,
        namespace: program.namespace
      })
    }));
  },

  /**
   * @return a promise resolved when the `mqtt` client
   * has been created.
   * @param {*} program an instance of `commander`.
   */
  createmqtt: function (program) {
    const opts = require(`${program.mqttOpts}`);
    return connect(opts).then((mqtt) => {
      this.mqtt   = mqtt;
      this.client = new Expressify.Client({
        strategy: new MqttStrategy({
          mqtt: mqtt,
          topic: program.topic || opts.topic || 'system'
        })
      })
    });
  }
};

/**
 * Expressify system information retriever class.
 */
class ExpressifyRetriever {
  
  /**
   * Class constructor.
   * @param {*} program an instance of `commander`. 
   */
  constructor(program) {
    this.program  = program;
    // A list of available commands.
    this.commands = commands();
    // Subscriptions.
    this.subscriptions = [];
  }

  /**
   * Prepares the current agent.
   * @return a promise resolved when the agent
   * is ready.
   */
  prepare() {
    if (this.prepared) return Promise.resolve();
    // Creating the Expressify client.
    try {
      return factory[`create${this.program.useExpressify}`]
        .call(this, this.program)
        .then(() => this.prepared = true);
    } catch (e) {
      return Promise.reject(e.name === 'TypeError' ? 
        `[!] Expressify method '${this.program.useExpressify}' is not supported.` : e
      );
    }
  }

  /**
   * @return an array of system information objects on all
   * the components of the system.
   */
  all() {
    return Promise.all(
      this.commands.map((command) => this.client.get(`/system/${command}`))
    ).then(
      (results) => results.map((res, idx) => ({
        res: res.payload,
        command: this.commands[idx]
      })
    ));
  }

  /**
   * @return an array of system information objects on the
   * components of the system associated with the given `array`.
   */
  some(array) {
    return Promise.all(
      array.map((command) => this.client.get(`/system/${command}`))
    ).then(
      (results) => results.map((res, idx) => ({
        res: res.payload,
        command: array[idx]
      })
    ));
  }

    /**
   * Subscribes to a given topic.
   * @param {*} topic the topic to subscribe to.
   * @param {*} callback function to be called on an
   * update event on the subscribed topic.
   */
  subscribe(topic, callback) {
    const resource = `/system/${topic}`;

    // Evemt handler.
    const f_ = (e) => {
      callback(topic, [{ res: e.payload, command: topic }]);
    };
    // Subscribing on the server.
    return this.client.subscribe(`/system/${topic}`, f_).then(() => {
      // Saving subscription.
      this.subscriptions.push({ resource, callback: f_ });
    });
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
    return new ExpressifyPty(this.client);
  }

  /**
   * Closes any connection opened by the client.
   */
  close() {
    let p_ = Promise.resolve();

    // Unsubscribing from resources.
    p_ = p_.then(() => Promise.all(
      this.subscriptions.map((subscription) =>
        this.client.unsubscribe(subscription.resource, subscription.callback)))
    );
    if (this.program.useExpressify === 'mqtt') {
      return (p_ = p_.then(() => this.client.close().then(() => disconnect.call(this))));
    }
    return (p_ = p_.then(() => this.client.close()));
  }
}

module.exports = ExpressifyRetriever;