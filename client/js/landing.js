const socket = io();

// html elements
var divEntry = document.getElementById('divEntry');
var entryTextName = document.getElementById('entryTextName');
var entryTextRoom = document.getElementById('entryTextRoom');
var entryButtonJoin = document.getElementById('entryButtonJoin');
var entryButtonCreate = document.getElementById('entryButtonCreate');
var divGame = document.getElementById('divGame');
var roomHeader = document.getElementById('roomHeader');
var playerList = document.getElementById('playerList');
var leaveButton = document.getElementById('leaveButton');

// state variables
var savedUserInfo;


// html element actions
entryButtonJoin.onclick = () => {
    socket.emit('userAttemptJoin', { name: entryTextName.value, room: entryTextRoom.value });
};

entryButtonCreate.onclick = () => {
    socket.emit('userAttemptCreate', { name: entryTextName.value });
};

leaveButton.onclick = () => {
    socket.emit('userAttemptLeave', savedUserInfo);
};


// utility functions
var getElem = (id) => {
    return document.getElementById(id);
};

var clearEntry = () => {
    entryTextName.value = '';
    entryTextRoom.value = '';
};


// socket events
socket.on('joinSuccess', (data) => {
    savedUserInfo = data;
    roomHeader.innerHTML = "Room: " + data.room;
    divGame.style.display = "inline";
    divEntry.style.display = "none";
    clearEntry();
});

socket.on('leaveSuccess', () => {
    savedUserInfo = undefined;
    divEntry.style.display = "inline";
    divGame.style.display = "none";
});

socket.on('playersUpdate', (data) => {
    console.log('playersUpdate');
    playerList.innerHTML = '<ul>';
    for (var player in data.players) {
        playerList.innerHTML += '<li>' + player + '</li>';
    }
    playerList.innerHTML += '</ul>';
});

socket.on('reconnect', () => {
    console.log('RECONNECT');
    socket.emit('userAttemptRejoin', savedUserInfo);
});

socket.on('clientConnected', (data) => {
    clearEntry();
    console.log('You are connected with socket: ' + data.socketId);
});
