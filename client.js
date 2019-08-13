'use strict'
var address = 'http://127.0.0.1:3000/'
var socket = require('socket.io-client')(address);
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
));

console.log('PLEASE MAKE SURE THAT YOU HAVE STARTED Ganache-cli IF YOU WANT TO USE IT!!!');

var contractData = require('./Contract/contr.js');
var accounts = [];
var clientAcc = ''; 
var hostAcc = '';
var contractAddress = '';
var contractInstance = {};


var clientId = 'Challenger';
var escrowValue = 20;

var stdin = process.openStdin();

stdin.addListener("data", async (d)=>{

    let text = d.toString().trim();

    let signature = await web3.eth.sign(text, clientAcc)
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


socket.on('connect', async ()=>{

    setmyAcc();

    console.log('Connected to ' + address);
    socket.on('hostMsg', (msgData)=>{

        //validate first
        console.log('Host entered: ' + msgData.text);
    });

    // Handshake -->

    await handshake();    

    // /Handshake
})
async function handshake(){
    socket.on('contract', async (contractInfo)=>{
        console.log('\n\n\'contract\' event received with the following data:--->\n',contractInfo);
        console.log('\n\nContract address is:--->\n',contractInfo.contractAdd);
        contractAddress = contractInfo.contractAdd;

        await setContractInstance();
        await setHostAcc();
        await setChallenge(clientId, escrowValue);
        

        socket.on('Handshaken', console.log)
        //socket.emit()
    });
    

}

async function setmyAcc(){
    await web3.eth.getAccounts()
    .then((acc)=>{
        accounts = acc;
        clientAcc = accounts[1];
        console.log('\n\nAccounts are:--->\n',accounts);
        console.log('\n\nClient Account is:--->\n',clientAcc);
    })
    .catch(console.log)
}

async function setContractInstance(){
    contractInstance = new web3.eth.Contract(contractData.abi, contractAddress);
}

async function setHostAcc(){
    await contractInstance.methods.gethost()
    .call({
        from: clientAcc
    })
    .then((result)=>{
        hostAcc = result[1]
        console.log('Host Id is: '+ result[0] +'\nHost Acc is: '+ result[1] +'\nHost escrow is: '+ result[2]);
    })
    .catch(console.log);
}

async function setChallenge(clientId, escrowValue){

    await contractInstance.methods.setchallenger(clientId)
    .send({from: clientAcc, value: escrowValue})
    .then(async (s)=>{
        await socket.emit('challengeSet', 'Game contract has been updated with my challenge!');
        //console.log('challenge set',s)
        }
    )
    .catch(console.log);
        
}

