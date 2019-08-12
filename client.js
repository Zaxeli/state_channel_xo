'use strict'
var address = 'http://127.0.0.1:3000/'
var socket = require('socket.io-client')(address);
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
));

console.log('PLEASE MAKE SURE THAT YOU HAVE STARTED Ganache-cli IF YOU WANT TO USE IT!!!');

var accounts = [];
var clientAcc = ''; 


var stdin = process.openStdin();

stdin.addListener("data",(d)=>{

    let text = d.toString().trim();

    let signature = await web3.eth.sign(clientAcc, text)
        .then((sign)=>{
            return sign;
        })
        .catch(console.log);

    let msgData = {
        text : text,
        signature : signature
    };

    console.log("Client entered: " + text);
    console.log('Sign : ' + signature);
    socket.emit('clientMsg', msgData);
});


socket.on('connect', ()=>{
    console.log('Connected to ' + address);
    socket.on('hostMsg', (data)=>{

        //validate first
        console.log('Host entered: ' + data.text);
    });
})

async function setmyAcc(){
    await web3.eth.getAccounts()
    .then((acc)=>{
        accounts = acc;
        clientAcc = accounts[1];
    })
    .catch(console.log)
}


