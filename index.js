//const promisify = require('util').promisify;
const Debug = require('debug');
const couchbase = require('./couchbase-client'); 
const eventing = couchbase.eventing;

var http = require('http');
const uuid = require('uuid/v1');
const serverName = 'my.domain.ltd';
//create a server object:
const httpServer = http.createServer(); //the server object listens on port 8080
var io = require('socket.io').listen(httpServer,errorHandler('ioListen'));

function errorHandler(name) {
  return (err) => {
    if (!err) {
      return;
    }
    global.console.error(name,err);
  };
  
}
httpServer.on('error',errorHandler('httpServer'));
httpServer.listen(8080,errorHandler('httpListen'));
const requestQueue = [];

const serverStatus = {
  get running() {
    if (couchbase.bucket) {
      return true;
    }
    return false;
  }, 
  requestQueue
};

//io.on('connection', function (socket) {
//  eventing.emit('ws',socket);
//socket.emit('welcome', { message: 'Welcome!', id: socket.id });
//socket.on('i am client', console.log);
//});

io.of('/').clients((error, clients) => {
  if (error) throw error;
  //console.log(clients); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
  clients.map(id => {
    io.sockets.connected(id).emit('message', 'data');
  });
});


function requestHandler(req, res) {
  req.on('error',errorHandler('httpReqServer'));
  res.on('error',errorHandler('httpResServer'));
  const id = uuid();
  const { headers, method, url } = req;
  const request = { headers ,method, url, id }; 
  Debug('requestHandler::request =>')(id);

  eventing.on('request',(request)=>{
    const { id } = request;
    eventing.emit(id,'Processed');
  });

  eventing.on(id, function responseHandler(data) {
    if (headers.connection !== 'close') {
      res.write(`Hello World! from ${serverName} - ${id}`); //write a response to the client
      res.write(data);
      res.end(); //end the response
    } else {
      res.end();
    }
  });

  if (serverStatus.running) {
    Debug('requestHandler::serverStatus =>')('running');
    eventing.emit('request', { id, req, res });    
  } else {
    requestQueue.push(request);
  }
  
}

httpServer.on('request', requestHandler);

//console.log('running => server.dns '+uuid());



/*
io.emit('httpRequest', req);
res.on('finish', () => {
  console.log('served');
});

bucket.upsert(`${request.id}`, request, (err) => {
  if (!err) {
    console.log(request);
    if (headers.connection !== 'close') {
      res.write(`Hello World! from ${serverName} - ${uuid()}`); //write a response to the client
      res.end(); //end the response
    }
    return;
    console.log(e);
  }
  console.log(err);
});
*/