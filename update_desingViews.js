var bucket = cluster.openBucket('hello');
var bucketMgr = bucket.manager();



function updateView(ddocname, viewname, callback) {
  /*
    var ddocdata = {
      views: {
        by_name: {
          map: function(doc, meta) {
            if (doc.type && doc.type == 'beer') {
              emit(doc.name, null);
            }
          }
        },
      }
    };
    dont delete the design documents be carefull
    */
  bucketMgr.getDesignDocument(ddocname, function (err, ddoc, meta) {
    if (err) {
      return callback(err);
    }
  
    //we have the current exhaustive list of views, delete the one we want to remove
    var ddocdata = ddoc.views[viewname];
    
    bucketMgr.upsertDesignDocument('ddocname', ddocdata, function (err) {
      console.log('Insertion of design document completed with error:', err);
    });
  });
}

function deleteView(ddocname, viewname, callback) {
  bucketMgr.getDesignDocument(ddocname, function(err, ddoc, meta) {
    if (err) {
      return callback(err);
    }
  
    //we have the current exhaustive list of views, delete the one we want to remove
    delete ddoc.views[viewname];
  
    //update the new exhaustive design document
    bucketMgr.upsertDesignDocument(ddocname, ddoc, function(err) {
      if (err) {
        return callback(err);
      }
  
      callback(null);
    });
  });
}