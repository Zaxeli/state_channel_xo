var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req,res){
    res.sendfile('index.html')
});

io.on('connection', function(socket){
    console.log('User connected');

    setTimeout(()=>{
        socket.send('a new message')
    },4000)

    socket.on('clientMove',(data)=>{
        console.log('clientMove enountered!');
        console.log(data);
    })

    setTimeout(()=>{socket.send('a new message strikes again')},4000)

    socket.on('disconnect', function(){
        console.log('User disconnected');
    })
});

http.listen(3000, function(){
    console.log('Listening on *:3000')
});