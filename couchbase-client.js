/**
 * Couchbase Event Driver
 */
const EventEmitter = require('events');
const couchbase = require('couchbase');

const Debug = require('debug');
class Couchbase extends couchbase.Cluster {
  constructor(config, eventEngine) {
    if (!config) {
      throw new Error('We need at last: { address ,user, password, bucket }');
    }
    if (!config.address) {
      config.address = 'couchbase://127.0.0.1';
    }
        
    if (!config.user) {
      config.user = 'Administrator';
    }

    if (!config.password) {
      config.password = global.process.env.COUCHBASE_KEY;
    }

    if (!config.bucket) {
      config.bucket = 'serverless';
    }
    super(config.address);
    Object.assign(this, couchbase);
    this.eventing = eventEngine;
    const { log } = console;

    this.eventing.on('connect', () => {
      Debug('onConnect => ')();
      this.bucket = this.openBucket(config.bucket, (err) => {
        if (!err) {
          return;
        }
      });
      
      this.eventing.on('upsert', (data) => {
        const { id, document } = data;
        this.eventing.bucket.upsert(id, document, (err) => {
          if (!err) {
            this.eventing.emit(id, 'upsert');
          } else {
            this.eventing.emit(id, err);
          }
        });
      });
      
      

      this.authenticate(config.user, config.password);
      this.eventing.emit('connect');
      
    });
  }
}

const cluster = new Couchbase({},new EventEmitter);



/*
  const openBucket = promisify(cluster.openBucket);
  openBucket('serverless').then(connected).catch((err) => {
    log(err);
  });
  */

module.exports = cluster;