# state_channel_xo
Tic-Tac-Toe game over a state channel for Ethereum

Note: Many features in the current implementation have been hardcoded in, and also, the griefing scenario has not been tackled. So, griefing *can* be performed in the current implementation. The current version simply serves to show, in a rudimentary way, that the tic-tac-toe game can be implemented so, using an Ethereum-smart-contracts-derived state channel.

Instructions:

(Prep)
1. Make sure node.js and npm are installed.
2. Install ganache-cli if not already installed.
3. Clone / copy  this repository to your device.

(Starting)  
4. Start ganache-cli  
5. Navigate to repository on your device.  
6. Run node host.js in a new terminal  
  Note: This is the first player to move once the game has been setup (player 1). The mark for this player is 'X'.
7. Run command in a new terminal: node client.js  
  Note: This is player 2. The mark for this player is 'O'.  

(Playing)  
Controls:
The game is basically on a 3x3 array, with each spot denoting a position on a tic tac toe grid.  
  y--->   
 x [['','',''],   
 | ['','',''],  
 V ['','','']]  
 
To make a move, enter the coordinates of the positon, e.g. enter '00' to place mark at (0,0).

8. The player 1 must make the first move.
9. Next, player 2 ... and so on.
9. When someone wins, the funds are automatically transferred.

Note: In current implementation, the initial escrow funds are hardcoded. Player1 : 10, Player2 : 20
