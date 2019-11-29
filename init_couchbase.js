var couchbase = require('couchbase');
const { log } = console;
// Access the cluster that is running on the local host, authenticating with
// the username and password of the Full Administrator. This
// provides all privileges.
var cluster = new couchbase.Cluster('couchbase://localhost');

log('Authenticating as administrator.');
cluster.authenticate('Administrator', 'password');

// Create a user and assign roles.
log('Upserting new user');
cluster.manager().upsertUser('localhost', 'cbtestuser', {
  password: 'cbtestuserpwd',
  roles: [

    // Roles required for the reading of data from the bucket.
    {role: 'data_reader', bucket_name: 'travel-sample'},
    {role: 'query_select', bucket_name: 'travel-sample'},

    // Roles required for the writing of data into the bucket.
    {role: 'data_writer', bucket_name: 'travel-sample'},
    {role: 'query_insert', bucket_name: 'travel-sample'},
    {role: 'query_delete', bucket_name: 'travel-sample'},

    // Role require for the creation of indexes on the bucket.
    {role: 'query_manage_index', bucket_name: 'travel-sample'}
  ]
}, function(err) {
  if (err) {
    throw err;
  }

  // List current users.
  cluster.manager().getUsers(function(err, users) {
    if (err) {
      throw err;
    }

    for(var i = 0; i < users.length; ++i) {
      var user = users[i];

      log();
      log('USER #' + i + ':');

      if (users.hasOwnProperty('name')) {
        log('Users name is: ' + user.name);
      }

      log('Users id is: ' + user.id);
      log('Users domain is: ' + user.domain);
      log();
    }

    // Access the cluster that is running on the local host, specifying
    // the username and password already assigned by the administrator
    cluster.authenticate('cbtestuser', 'cbtestuserpwd');

    // Open a known, existing bucket (created by the administrator).
    log('Opening travel-sample bucket as user.');
    var travelSample = cluster.openBucket('travel-sample');

    // Create a N1QL Primary Index (but ignore if one already exists).
    travelSample.manager().createPrimaryIndex({
      ignoreIfExists: true
    }, function(err) {
      if (err) {
        throw err;
      }

      // Read out a known, existing document within the bucket (created
      // by the administrator).
      log('Reading out airline_10 document.');
      travelSample.get('airline_10', function(err, res) {
        if (err) {
          throw err;
        }

        log('Found:');
        log(res);

        // Create a new document
        log('Creating new document as user.');
        var airline11Object = {
          callsign: 'MILE-AIR',
          iata: 'Q5',
          icao: 'MLA',
          id: 11,
          name: '40-Mile Air',
          type: 'airline'
        };

        // Upsert the document to the bucket.
        log('Upserting new document as user.');
        travelSample.upsert('airline_11', airline11Object, function(err) {
          if (err) {
            throw err;
          }

          log('Reading out airline11Document as user.');
          travelSample.get('airline_11', function(err, res) {
            if (err) {
              throw err;
            }

            log('Found:');
            log(res);

            log('Performing query as user.');

            travelSample.query(couchbase.N1qlQuery.fromString(
              'SELECT * FROM `travel-sample` LIMIT 5'), function(err, rows) {
              if (err) {
                throw err;
              }

              log('Query results are:');
              for (var i = 0; i < rows.length; ++i) {
                log(rows[i]);
              }

              // Access the cluster that is running on the local host,
              // authenticating with the username and password of the Full
              // Administrator. This provides all privileges.
              log('Re-authenticating as administrator.');
              cluster.authenticate('Administrator', 'password');

              // Remove known user.
              log('Removing user as administrator.');
              var userToBeRemoved = 'cbtestuser';
              cluster.manager().removeUser(userToBeRemoved, function(err) {
                if (err) {
                  log('Could not delete user ' + userToBeRemoved);
                  throw err;
                }

                log('Deleted user ' + userToBeRemoved);

                global.process.exit(0);
              });
            });
          });
        });
      });
    });
  });
});