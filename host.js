'use strict'

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
));

console.log('PLEASE MAKE SURE THAT YOU HAVE STARTED Ganache-cli IF YOU WANT TO USE IT!!!');

var accounts = [];
var hostAcc = ''; 


app.get('/', function(req,res){
    res.sendfile('index.html');
});

var _socket = {};

var stdin = process.openStdin();
stdin.addListener("data", async (d)=>{

    let text = d.toString().trim()

    let signature = await web3.eth.sign(text, hostAcc)
        .then((sign)=>{
            return sign;
        })
        .catch(console.log)

    let msgData = {
        text: text,
        signature: signature
    }

    _socket.emit('hostMsg', msgData);
    console.log('Host entered : ' + text);
    console.log('Sign : ' + signature);
    

});

io.on('connection', async (socket)=>{

    await setmyAcc();
    console.log(accounts);
    console.log(hostAcc);

    _socket = socket
    var address = socket.handshake.address;
    var port = socket.request.connection.remotePort
    console.log( address + ':' + port + ' has connected!');

    socket.on('clientMsg',(data)=>{
        // validate first
        console.log('Client entered : ' + data.text)
    });

    socket.on('disconnect', ()=>{
        console.log( address + ':' + port + ' has disconnected!');
    })

});

http.listen(3000, ()=>{
    console.log('Listening on port :3000');
})

//-----------------------------------------------

async function setmyAcc(){
    await web3.eth.getAccounts()
    .then((acc)=>{
        accounts = acc;
        hostAcc = accounts[0];
    })
    .catch(console.log)
}

function authenticate(signedMsg, address){
    /**
     * It should make sure the signee of the 'signedMsg' is the 'address' given in argument
     * 
     * signedMsg {
     *      text: text
     *      signature: web3.eth.sign(text)
     * }
     */
    signee = web3.eth.accounts.recover(signedMsg.text, signedMsg.signature);

    if(address == signee){
        return true;
    }
    else{
        return false;
    }
}

function validMove(){
    /**
     * It should check if the move is actually a valid move
     */
}

function sendSignedMsg(){
    /**
     * Get some message, sign it and bundle it up together for sending
     * Returns: ready to send 'Object' message with text and sign - 'signedMsg'
     */
}