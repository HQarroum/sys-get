const system = require('systeminformation');

/**
 * Storage module entry point.
 */
module.exports = {
  get: () => Promise.all([ system.fsSize(), system.blockDevices() ]).then((results) => Promise.resolve({
      filesystems: results[0],
      devices: results[1]
    })).then((res) => system.disksIO().then((ios) => {
      res['ios'] = ios;
      return (res);
    }).catch(() => res))
};