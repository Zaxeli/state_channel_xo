'use strict'

module.exports = {

    socket : {},

    web3 : {},

    setWeb3 : function(_web3){
        this.web3 = _web3;
    },

    setSocket : function(_socket){
        this.socket = _socket;
    },

    translateMoveToGameState : function(move, gameState, playersMark){
        /**
         * take the raw console input and translate it, if possible, to a game state - the new one, for proposing to opponent
         * 
         * gameState: 3x3 array for tic-tac-toe
         *   y--->
         * x [[00,01,02],
         * |  [10,11,12],
         * V  [20,21,22]]
         * 
         * 
         * move (string): example -> '00' for pos 0,0 (x,y)
         * 
         * playerNo:
         *  'X' is host,
         *  'O' is challenger
         */
        
        move = {
            x: parseInt(move[0]),
            y: parseInt(move[1])
        };

        if(gameState[move.x][move.y] != ''){
            // invalid move
            throw new Error('Tried to make an invalid move! Position not empty!');
        }

        else if(gameState[move.x][move.y] == ''){
            gameState[move.x][move.y] = playersMark;
        }

        return gameState;
    },

    checkValidMove : function(currentState, newGameState, playersMark){
        /**
         * check if the move is valid or not
         */

        let changes=0;
        var valid = true;
        
        for(let i=0;i<3;i++){
            for(let j=0;j<3;j++){
                if(currentState[i][j] === newGameState[i][j]){
                    // Carry on
                }
                else if(currentState[i][j] !== newGameState[i][j]){
                    if((currentState[i][j] === '') && (newGameState[i][j] === playersMark)){
                        // if empty spot and mark made belongs to player
                        changes++;
                    }
                    else{
                        // tried to mark with a wrong mark
                        valid = false; 
                    }
                }
            }
        }
        if(changes != 1){
            // tried to make more than 1 mark or no mark at all (skip chance)
            valid = false;
        }
        return valid;
    },

    proposeMove : async function(moveData, opponentAdd){
        /**
         * propose the move to opponent and await confirmation
         * if confirmed, update
         * if not confirmed, maybe greifing
         * 
         * moveData {
         *      oldBoard: oldBoard,
         *      newBoard: newBoard,
         *      
         *      moveBySign: sign,
         *      moveTakerSign : sign
         * }
         */

        if(this.socket == {}){
            throw new Error('Socket has not been set! Please set socket first!');
        }

        if(this.web3 == {}){
            throw new Error('web3 moodule is not defined, please set it before its use by using setWeb3() function in this module!');
        }

        this.socket.emit('moveMade', moveData);

        return await this.socket.on('moveConfirm', (_moveData)=>{

            let authentic = true;

            authentic = authentic && _moveData.oldBoard == moveData.oldBoard;
            authentic = authentic && _moveData.newBoard == moveData.newBoard;
            authentic = authentic && _moveData.moveBySign == moveData.moveBySign;


            let signee = web3.eth.accounts.recover(moveData, _moveData.moveTakerSign);

            authentic = authentic && signee == opponentAdd;

            if(!authentic){
                return false;
            }

            return _moveData;
        });

    },

    // counterpart to proposemove()
    confirmMove : async function(oldBoard, playersMark, opponentAdd, myAdd){
        if(this.socket == {}){
            throw new Error('Socket has not been set! Please set socket first!');
        }
        if(this.web3 == {}){
            throw new Error('web3 moodule is not defined, please set it before its use by using setWeb3() function in this module!');
        }
        
        this.socket.on('moveMade', (_moveData)=>{

            let okay = true;

            okay = okay && _moveData.oldBoard == oldBoard;
            okay = okay && this.checkValidMove(oldBoard, _moveData.newBoard, playersMark);

            // check opponents sign
            // opponent would have signed an obj with empty sign field

            var moveBySign = _moveData.moveBySign;
            _moveData.moveBySign = '';

            okay = okay && opponentAdd == this.web3.eth.accounts.recover(_moveData, moveBySign);

            // make my sign if okay

            if(okay){
                _moveData.moveBySign = moveBySign;
                _moveData.moveTakerSign = this.web3.eth.sign(_moveData, myAdd);

                await this.socket.emit('moveConfirm', _moveData);
            }
            else if(!okay){
                await this.socket.emit('moveConfirm', _moveData);
                throw new Error('Something amiss found in the move while confirming!');
            }
        });
    }
}
/*
var board = 
    [['O','',''],
    ['','',''],
    ['','','']];

var move = '01';

var newBoard = 
    [['O','',''],
    ['','X',''],
    ['','','']];

var playersMark = 'X';

console.log(module.exports.setSocket({a:1}),module.exports.socket);
*/