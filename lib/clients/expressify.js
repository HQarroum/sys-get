const fs            = require('fs');
const iot           = require('aws-iot-device-sdk');
const Expressify    = require('../../../expressify');
const IpcStrategy   = require('../../../expressify-ipc');
const MqttStrategy  = require('../../../expressify-mqtt');
const commands      = require('../commands');
const ExpressifyPty = require('../../dashboard/pty-expressify');

/**
 * Initiates an MQTT connection.
 * @param {*} opts the options to pass to the MQTT library.
 */
const connect = (opts) => new Promise((resolve, reject) => {
  const mqtt = iot.device(opts);
  mqtt.on('connect', () => resolve(mqtt));
  mqtt.on('error', () => {});
});

/**
 * Destroys an MQTT connection.
 */
const disconnect = function () {
  return new Promise((resolve, reject) => {
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
    const opts = require(`${process.cwd()}/${program.mqttOpts}`);
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
    if (this.program.useExpressify === 'mqtt') {
      return (this.client.close().then(() => disconnect.call(this)));
    }
    return (this.client.close());
  }
};

module.exports = ExpressifyRetriever;