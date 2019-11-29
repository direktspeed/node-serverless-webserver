const user = null;
const password = global.process.env.COUCHBASE_KEY;
const bucketName = null;
const { log } = global.console;
const bucketConfig = {
  authType: 'sasl',
  bucketType: 'couchbase',
  ramQuotaMB: 100,
  replicaNumber: 0,
  saslPassword: null,
  flushEnabled: 0
};

function createBucket(cluster) {
  cluster
    .manager(user, password)
    .createBucket(bucketName, bucketConfig, (err) => {
      if (!err) {
        log('created bucket');
        return;
      } else if (err.message.indexOf('already exists') > -1){
        log(bucketName+' '+err.message);
        return;
      }
      log('Creation of '+bucketName+' bucket failed:', err);
    });
}


module.exports = createBucket;