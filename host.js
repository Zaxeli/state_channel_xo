'use strict'

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req,res){
    res.sendfile('index.html');
});

var _socket = {};

var stdin = process.openStdin();
stdin.addListener("data", (d)=>{
    _socket.emit('hostMsg', d.toString().trim());
    console.log('Host entered : ' + d.toString().trim());
});

io.on('connection', (socket)=>{
    _socket = socket
    var address = socket.handshake.address;
    var port = socket.request.connection.remotePort
    console.log( address + ':' + port + ' has connected!');

    socket.on('clientMsg',(data)=>{
        console.log('Client entered : ' + data)
    });


    socket.on('disconnect', ()=>{
        console.log( address + ':' + port + ' has disconnected!');
    })

    

});

http.listen(3000, ()=>{
    console.log('Listening on port :3000');
})