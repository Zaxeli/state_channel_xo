'use strict'
var address = 'http://127.0.0.1:3000/'
var socket = require('socket.io-client')(address);

var stdin = process.openStdin();

stdin.addListener("data",(d)=>{
    console.log("Client entered: " + d.toString().trim());
    socket.emit('clientMsg', d.toString().trim());
});


socket.on('connect', ()=>{
    console.log('Connected to ' + address);
    socket.on('hostMsg', (data)=>{
        console.log('Host entered: ' + data);
    });
})



