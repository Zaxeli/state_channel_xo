'use strict'

var contr = require('./Contract/contr.js')
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
));

console.log('PLEASE MAKE SURE THAT YOU HAVE STARTED Ganache-cli IF YOU WANT TO USE IT!!!');

var accounts = [];

main()

async function main(){
    await web3.eth.getAccounts().then((acc)=>{accounts = acc;}).catch(console.log);
    console.log(accounts)

    console.log(contr.bytecode.object)

    var contractInstance = new web3.eth.Contract(contr.abi);
    await contractInstance.deploy({data: contr.bytecode.object, arguments: ['abc']})
    .send({
        from: accounts[0],
        gas: 1500000,
        gasPrice: '30000000000000',
        value: 20
    })
    .then((res)=>{console.log('address is -> ' + res.options.address)})
    .catch(console.log)

    await web3.eth.sign('Hello',accounts[0]).then(console.log).catch(console.log)

}