'use strict'


var board = 
    [['','',''],
    ['','',''],
    ['','','']];

var address = 'http://127.0.0.1:3000/'
var moveUtil = require('./Utils/moves.js')
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
var hostMark = 'X';
var clientMark = 'O';


var clientId = 'Challenger';
var escrowValue = 20;

var stdin = process.openStdin();

stdin.addListener("data", async (move)=>{

    //await sendSignedMsg(d);

    console.log(board);

    if( moveUtil.checkTurn(board) == clientMark ){
        // if it's my turn

        var newBoard = moveUtil.translateMoveToGameState(move, board, clientMark);

        var moveData = moveUtil.newMoveData(board, newBoard);

        var signature = await web3.eth.sign(moveData, clientAcc)
        .then((sign)=>{
            return sign;
        })
        .catch(console.log);

        moveData.moveBySign = signature;

        socket.emit('clientMove', moveData);

        socket.on('clientMoveAck', (_moveData)=>{
            var hostSign = _moveData.moveTakerSign;
            _moveData.moveTakerSign = ''

            if( ( JSON.stringify(moveData) == JSON.stringify(_moveData) ) && ( hostAcc == web3.eth.accounts.recover(_moveData, hostSign) )){
                // if the moveData is not changed, and the sign is authentically by host
                
                board = newBoard;

                // client Victory?
                // send emit for clientWin
                // redeem reward from contract
            }
        });
    }

});


socket.on('connect', async ()=>{
    console.log(moveUtil)
    moveUtil.setSocket(socket);
    moveUtil.setWeb3(web3);

    setmyAcc();

    console.log('Connected to ' + address);
    socket.on('hostMsg', (msgData)=>{

        //validate first
        console.log('Host entered: ' + msgData.text);
    });

    

    // Handshake -->

    await handshake();    

    // /Handshake

    socket.on('hostMove', (moveData)=>{

        var hostSign = moveData.moveBySign;
        moveData.moveBySign = '';

        // is the hostMove's oldBoard same as my board? 
        // and it was their turn to move?
        // and the move made is valid?
        // and hostMove's sign is authentic?
        if( JSON.stringify(moveData.oldBoard) == JSON.stringify(board) &&
            moveUtil.checkTurn(board) == hostMark &&
            moveUtil.checkValidMove(moveData.oldBoard, moveData.newBoard, hostMark) == true &&
            hostAcc == web3.eth.accounts.recover(_moveData, hostSign)){
            
                // put their sign back
                // make my sign and add it
                // send emit for hostMoveAck

                moveData.moveBySign = hostSign;

                moveData.moveTakerSign = web3.eth.sign(moveData, clientAcc);

                socket.emit('hostMoveAck', moveData);

                board = moveTakerSign.newBoard;

                // host Victory?
                // get hostWin event,
                // do something


               

            
        }
    });
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

async function sendSignedMsg(rawMsg){
    /**
     * Get some message, sign it and bundle it up together for sending
     * Returns: ready to send 'Object' message with text and sign - 'signedMsg'
     */
    let text = rawMsg.toString().trim()

    let signature = await web3.eth.sign(text, clientAcc)
        .then((sign)=>{
            return sign;
        })
        .catch(console.log)

    let msgData = {
        text: text,
        signature: signature
    }

    socket.emit('clientMsg', msgData);
    console.log('Client entered : ' + text);
    console.log('Sign : ' + signature);
}

// -- Move to new file - common for both players

function translateMoveToGameState(){
    /**
     * take the raw console input and translate it, if possible, to a game state - the new one, for proposing to opponent
     */
    return newGameState;
}

function checkValidMove(currentState){
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