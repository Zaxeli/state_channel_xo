pragma solidity >0.4.0;

contract Game {

    string hostId;
    string challengerId;

    uint hostEscrow;
    uint challengerescrow;

    struct Player  {
        string playerId;
        address payable playerAddress;
        uint playerEscrow;
        uint nonce;
    }

    Player host;
    Player challenger;
    
    event challengerUpdate(string, address, uint);

    constructor(string memory _hostId, uint _hostNonce) public payable {

        host.playerAddress = msg.sender;

        host.playerId = _hostId;

        host.playerEscrow = msg.value;
        
        host.nonce = _hostNonce;


    }
    
    function sethostid(string memory _hostId) public returns (string memory, address, uint) {
        if(msg.sender != host.playerAddress){
            revert();
        }
        host.playerId = _hostId;
        return gethost();
    }

    // Get  game credentials

    function gethost() public view returns (string memory, address, uint){
        return (host.playerId, host.playerAddress, host.playerEscrow);
    }

    function getchallenger() public view returns (string memory, address, uint){
        return (challenger.playerId, challenger.playerAddress, challenger.playerEscrow);
    }

    // Set game credentials

    function setchallenger(string memory _playerId, uint _playerNonce) public payable returns (string memory, address, uint){
        challenger.playerId = _playerId;
        challenger.playerAddress = msg.sender;
        challenger.playerEscrow = challenger.playerEscrow + msg.value;
        challenger.nonce = _playerNonce;
        
        emit challengerUpdate(challenger.playerId, challenger.playerAddress, challenger.playerEscrow);

        return (challenger.playerId, challenger.playerAddress, challenger.playerEscrow);
    }

    // Dispute settlement

    // Victory settlement

    function redeem (uint  nonce) public{
        if( msg.sender == challenger.playerAddress && nonce == host.nonce){
            
            uint val = host.playerEscrow + challenger.playerEscrow;
            host.playerEscrow = 0;
            challenger.playerEscrow = 0;
            
            challenger.playerAddress.transfer(val);
        }
        
        if( msg.sender == host.playerAddress && nonce == challenger.nonce){
            
            uint val = host.playerEscrow + challenger.playerEscrow;
            host.playerEscrow = 0;
            challenger.playerEscrow = 0;
            
            host.playerAddress.transfer(val);
        }
        
    }
    
}