var socket = require('socket.io-client')('http://localhost:8080');
  
socket.on('welcome', function(data) {
  console.log(data.message);
  // Respond with a message including this clients' id sent from the server
  socket.emit('i am client', {data: 'foo!', id: data.id});
});
socket.on('time', function(data) {
  console.log(data.time);
});

socket.on('error', console.error);
socket.on('message', console.log);
socket.on('request', (data)=> {
  const { id } = data;
  socket.emit(id,'Processed')
});

module.exports = socket;