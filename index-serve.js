const program      = require('commander');
const Pty          = require('node-pty');
const iot          = require('aws-iot-device-sdk');
const Expressify   = require('../expressify');
const IpcStrategy  = require('../expressify-ipc');
const MqttStrategy = require('../expressify-mqtt');
const system       = require('./lib');
let instance       = null;

// Pty instances.
const ptys = {};

/**
 * The domains we are notifying the client about.
 */
const domains = [
  'processes',
  'cpu',
  'storage',
  'os',
  'memory',
  'network'
];

/**
 * The updates refresh rate.
 */
const rate = program.refreshRate || (15 * 1000);

/**
 * Initiates an MQTT connection.
 * @param {*} opts the options to pass to the MQTT library.
 */
const connect = (opts) => new Promise((resolve, reject) => {
  const mqtt = iot.device(opts);
  mqtt.on('connect', () => resolve(mqtt));
});

const factory = {

  /**
   * @return a promise resolved when the `ipc` Server
   * has been created.
   * @param {*} program an instance of `commander`.
   */
  createipc: function (program) {
    return Promise.resolve(new Expressify.Server({
      strategy: new IpcStrategy({
        endpoint: program.endpoint,
        namespace: program.namespace
      })
    }));
  },

  /**
   * @return a promise resolved when the `mqtt` Server
   * has been created.
   * @param {*} program an instance of `commander`.
   */
  createmqtt: function (program) {
    if (!program.mqttOpts) return Promise.reject('[!] --mqtt-opts <path> is required');
    const opts = require(`${process.cwd()}/${program.mqttOpts}`);
    return connect(opts).then((mqtt) => new Expressify.Server({
        strategy: new MqttStrategy({
          mqtt: mqtt,
          topic: program.topic || opts.topic || 'system'
        })
      })
    );
  }
};

/**
 * @return a string representation of a randomly
 * created GUID.
 */
const guid = () => {
  const s4 = function () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

/**
 * Declares the resources supported by the server
 * and starts listening for requestes.
 * @param {*} server the server instance.
 */
const start = (server) => {

  /**
   * Retrieves and returns informations about running
   * processes on the host, along with load information.
   */
  server.get('/system/processes', (req, res) => {
    system.processes.get().then((r) => res.send(r));
  });

  /**
   * Retrieves and returns informations about the
   * graphics system.
   */
  server.get('/system/graphics', (req, res) => {
    system.graphics.get().then((r) => res.send(r));
  });

  /**
   * Retrieves and returns information about the avaialable CPUs,
   * as well as load information.
   */
  server.get('/system/cpu', (req, res) => {
    system.cpu.get().then((r) => res.send(r));
  });

  /**
   * Retrieves and returns information abut the storage
   * devices available on the host.
   */
  server.get('/system/storage', (req, res) => {
    system.storage.get().then((r) => res.send(r));
  });

  /**
   * Retrieves and returns general information about
   * the host operating system.
   */
  server.get('/system/os', (req, res) => {
    system.os.get().then((r) => res.send(r));
  });

  /**
   * Retrieves and returns information about the host
   * memory (usage, load, free memory).
   */
  server.get('/system/memory', (req, res) => {
    system.memory.get().then((r) => res.send(r));
  });

  /**
   * Retrieves and returns information on the network
   * interfaces available on the host.
   */
  server.get('/system/network', (req, res) => {
    system.network.get().then((r) => res.send(r));
  });

  /**
   * Creates a new PTY instance..
   */
  server.post('/system/pty', (req, res) => {
    // Generating a UUID for the created `pty`.
    const uuid = guid();
    // Creating a new `pty`.
    const pty  = Pty.fork(req.payload.shell, req.payload.args, req.payload.options);
    // Subscribing to `data` events.
    pty.on('data', (data) => {
      server.publish(`/system/pty/${uuid}`, data)
    });
    // Saving the `pty` instance.
    ptys[uuid] = pty;
    // Responding with the UUID associated with the `pty`.
    res.send({ uuid });
  });

  /**
   * Updates a PTY instance.
   */
  server.patch('/system/pty/:uuid', (req, res) => {
    const pty = ptys[req.params.uuid];

    // If the `pty` does not exist, we send an error.
    if (!pty) {
      return (res.send(404));
    }

    // If the request is a `resize` request, we resize
    // the terminal.
    if (req.payload.request === 'resize') {
      pty.resize(req.payload.width, req.payload.height);
      return (res.send(200));
    }
    
    // Otherwise a `Bad Request` response is sent to the client.
    res.send(400, { error: `Unsupported request ${req.payload.request}`});
  });

  /**
   * Writes on a PTY instance.
   */
  server.put('/system/pty/:uuid', (req, res) => {
    const pty = ptys[req.params.uuid];

    // If the `pty` does not exist, we send an error.
    if (!pty) {
      return (res.send(404));
    }
    // Writing the data on the `pty`.
    pty.write(new Buffer(req.payload.data));
    return (res.send(200));
  });

  /**
   * Destroys a PTY instance..
   */
  server.delete('/system/pty/:uuid', (req, res) => {
    const pty = ptys[req.params.uuid];

    // Destroying the `pty` instance if it exists.
    if (pty) {
      pty.destroy();
      delete ptys[req.params.uuid];
      return (res.send(200));
    }
    res.send(404);
  });

  /**
   * Listening for incoming requests.
   */
  server.listen().then(() => {
    console.log(`[+] The server is listening for incoming requests using the '${program.useExpressify}' strategy !`);
    // Creating the interval loop notifying clients of
    // changes in the local system model.
    intervals = domains.map((d) => setInterval(() => {
      system[d].get().then((r) => server.publish(`/system/${d}`, r));
    }, 10 * 1000));
  });

  // Registering the server instance.
  instance = server;
};

/**
 * Gracefully exits the application.
 * @param {*} err the received error.
 */
const fail = (err) => {
  console.error(err.name === 'TypeError' ? 
    `[!] Expressify method '${program.useExpressify}' is not supported.` : err
  );
  process.exit(-1);
};

// Creating the Expressify server.
try {
  // Defaulting expressify strategy to `ipc`.
  if (!program.useExpressify) program.useExpressify = 'ipc';
  // Creating the Expressify server.
  factory[`create${program.useExpressify}`]
    .call(this, program)
    .then(start)
    .catch(fail);
} catch (e) {
  fail(e);
}

/**
 * Closing the open connections when leaving the application.
 */
['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    console.log('[+] Closing the server ...');
    // Destroying all the PTYs.
    Object.keys(ptys).forEach((pty) => pty.destroy && pty.destroy());
    // Clears all created intervals.
    intervals && intervals.forEach((i) => clearInterval(i));
    // Closing the connection.
    instance && instance.close().then(process.exit);
  });
});
