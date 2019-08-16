'use strict'

var board = 
    [['','',''],
    ['','',''],
    ['','','']];

var moveUtil = require('./Utils/moves.js');
var contractData = require('./Contract/contr.js');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.WebsocketProvider(
    'http://localhost:8545'
));

console.log('PLEASE MAKE SURE THAT YOU HAVE STARTED Ganache-cli IF YOU WANT TO USE IT!!!');

const hostNonce = (Math.floor(Math.random() * 1e16)).toString();
const hostNonceHash = web3.eth.accounts.hashMessage(hostNonce);
//console.log(hostNonce,'!!!\n',hostNonceHash);

var clientNonce = '';

var accounts = [];
var hostAcc = ''; 
var clientAcc = '';
var contractAddress = '';
var contractInstance = {};
var hostMark = 'X';
var clientMark = 'O';


app.get('/', function(req,res){
    res.sendfile('index.html');
});

var _socket = {};

var moveData = {};

var stdin = process.openStdin();
stdin.addListener("data", async (move)=>{
    // making the raw input to simple string
    move = move.toString().trim();

    //await sendSignedMsg(d);

    if( moveUtil.checkTurn(board) == hostMark ){
        // if it's my turn
        
        var newBoard = moveUtil.translateMoveToGameState(move, board, hostMark);

        moveData = moveUtil.newMoveData(board, newBoard);

        var signature = await web3.eth.sign(JSON.stringify(moveData), hostAcc)
        .then((sign)=>{
            return sign;
        })
        .catch(console.log);

        moveData.moveBySign = signature;

        _socket.emit('hostMove', moveData);

        
    }
    

});

io.on('connection', async (socket)=>{

    await setmyAcc();
    await deployContract(10)
    //await setClientAcc(); <---
    

    console.log('\n\nAccounts are:--->\n',accounts);
    console.log('\n\nHost account is:--->\n',hostAcc);

    _socket = socket

    // Handshake
    // Send Game contract address as a socket emit event
    await handshake()
    

    // /Handshake

    var address = socket.handshake.address;
    var port = socket.request.connection.remotePort
    console.log( address + ':' + port + ' has connected!');

    socket.on('clientMsg',(msgData)=>{
        // validate first
        if(!authenticate(msgData, clientAcc)){
            return;
        }
        console.log('Client entered : ' + msgData.text)
    });

    socket.on('clientMove', async (moveData)=>{

        var clientSign = moveData.moveBySign;
        moveData.moveBySign = '';

        // is the hostMove's oldBoard same as my board? 
        // and it was their turn to move?
        // and the move made is valid?
        // and hostMove's sign is authentic?
        if( JSON.stringify(moveData.oldBoard) == JSON.stringify(board) &&
            moveUtil.checkTurn(board) == clientMark &&
            moveUtil.checkValidMove(moveData.oldBoard, moveData.newBoard, clientMark) == true &&
            clientAcc == web3.eth.accounts.recover(JSON.stringify(moveData), clientSign)){
            
                // put their sign back
                // make my sign and add it
                // send emit for hostMoveAck

                moveData.moveBySign = clientSign;

                moveData.moveTakerSign = await web3.eth.sign(JSON.stringify(moveData), hostAcc)
                .then((sign)=>{
                    return sign;
                })
                .catch(console.log);

console.log(moveData)

                socket.emit('clientMoveAck', moveData);

                board = moveData.newBoard;
                console.log('BOARD:\n',board);
                let chance = moveUtil.checkTurn(board);
                if(chance == 'X') console.log('Host\'s turn');
                else if(chance == 'O') console.log('Client\'s turn');
                else if(chance == false) throw new Error('Something is wrong on the board!');
                else if(chance['victory']) console.log(chance['victor'],' WON!');

                // client Victory?
                // get hostWin event,
                // do something


               

            
        }
    });

    _socket.on('hostMoveAck', async (_moveData)=>{

        var clientSign = _moveData.moveTakerSign;
        _moveData.moveTakerSign = ''
        
        if( ( JSON.stringify(moveData) == JSON.stringify(_moveData) ) && ( clientAcc ==  await web3.eth.accounts.recover(JSON.stringify(_moveData), clientSign) )){
            // if the moveData is not changed, and the sign is authentically by host
            
            board = _moveData.newBoard;

            console.log('BOARD:\n',board);
            let chance = moveUtil.checkTurn(board);
            if(chance == 'X') console.log('Host\'s turn');
            else if(chance == 'O') console.log('Client\'s turn');
            else if(chance == false) throw new Error('Something is wrong on the board!');
            else if(chance['victory']){
                console.log(chance['victor'],' WON!');
                socket.emit('hostWin','host wins!')
            } 
            // host Victory?
            // send emit for hostWin
            // redeem reward from contract
        }
    });

    socket.on('clientWin', (d)=>{
        console.log(d);
        socket.emit('clientWinAck', hostNonce);
    });

    socket.on('hostWinAck', async (clientNonce)=>{

        await contractInstance.methods.redeem(clientNonce)
        .send({from: hostAcc, gas: 1500000, gasPrice: '300' })
        .then(async (s)=>{
                console.log('Value redeemed!')
            }
        )
        .catch(console.log);

    })

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

async function setClientAcc(){

    await contractInstance.methods.getchallenger()
    .call({
        from: hostAcc
    }).
    then((result)=>{
        clientAcc = result[1];
        console.log('Challenger Id is: '+ result[0] +'\nChallenger Acc is: '+ result[1] +'\nChallenger escrow is: '+ result[2]);
    })
    .catch(console.log);

}

async function handshake(){
    await _socket.emit('contract',{
        msg: 'Game Contract address is'+contractAddress,
        contractAdd: contractAddress
    });

    await _socket.on('challengeSet', async (msg)=>{
        console.log(msg);
        await setClientAcc();
    });

    await _socket.emit('Handshaken', 'Handshake complete!');
    console.log('Handshake complete!');
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
    var signee = web3.eth.accounts.recover(signedMsg.text, signedMsg.signature);

    if(address == signee){
        return true;
    }
    else{
        return false;
    }
}

async function deployContract(escrowValue){

    // Don't redeploy contract is already exists
    /*if(contractAddress != ''){
        return;
    }*/

    contractInstance = new web3.eth.Contract(contractData.abi);
    var contractAdd = await contractInstance.deploy({data: contractData.bytecode.object, arguments: ['abc', hostNonce]})
    .send({
        from: accounts[0],
        gas: 1500000,
        gasPrice: '300',
        value: escrowValue
    })
    .then((res)=>{
        console.log('\n\nGame Contract address is:--->\n',res.options.address);
        return res.options.address;
    })
    .catch(console.log);

    contractAddress = contractAdd;
    
    contractInstance = new web3.eth.Contract(contractData.abi, contractAddress);
    
}

function validMove(){
    /**
     * It should check if the move is actually a valid move
     */
}

async function sendSignedMsg(rawMsg){
    /**
     * Get some message, sign it and bundle it up together for sending
     * Returns: ready to send 'Object' message with text and sign - 'signedMsg'
     */
    let text = rawMsg.toString().trim()

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
}

// -- Move to new file - common for both players

function translateMoveToGameState(){
    /**
     * take the raw console input and translate it, if possible, to a game state - the new one, for proposing to opponent
     */
    return newGameState;
}

function checkValidMove(){
    /**
     * check if the move is valid or not
     */
}

function proposeMove(){
    /**
     * propose the move to opponent and await confirmation
     * if confirmed, update
     * if not confirmed, maybe greifing
     */

}