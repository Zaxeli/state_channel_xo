'use strict'

var contr = require('./Contract/contr.js')
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
));

console.log('PLEASE MAKE SURE THAT YOU HAVE STARTED Ganache-cli IF YOU WANT TO USE IT!!!');

var accounts = [];

var conAdd = '0x8b22815eeff15f58b0582a260a8bd7af69fa9720'

main()

async function main(){
    await web3.eth.getAccounts().then((acc)=>{accounts = acc;}).catch(console.log);
    console.log(accounts)
    
    var contractInstance = new web3.eth.Contract(contr.abi, conAdd);
//    contractInstance = contractInstance.at(conAdd);

    contractInstance.methods.gethost().call({from: accounts[1]}).then(console.log).catch(console.log);

}