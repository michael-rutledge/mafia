// constants
const socket = io();

// html elements
var divEntry = document.getElementById('divEntry');
var entryTextName = document.getElementById('entryTextName');
var entryTextRoom = document.getElementById('entryTextRoom');
var divGame = document.getElementById('divGame');
var roomHeader = document.getElementById('roomHeader');
var stateMessage = document.getElementById('stateMessage');
var playerList = document.getElementById('playerList');
var lobbyOptions = document.getElementById('lobbyOptions');
var hostOptions = document.getElementById('hostOptions');
var numMafia = document.getElementById('numMafia');
var numCops = document.getElementById('numCops');
var numDoctors = document.getElementById('numDoctors');
var playAgainButton = document.getElementById('playAgainButton');
var endButton = document.getElementById('endButton');

// state variables
var savedUserInfo;


// helper functions
function hostSelect(elem) {
    socket.emit('hostOptionChange', {
        id: elem.id,
        value: elem.value
    });
}

var clearEntry = () => {
    entryTextName.value = '';
    entryTextRoom.value = '';
};


// html element actions
document.getElementById('entryButtonJoin').onclick = () => {
    socket.emit('userAttemptJoin', { name: entryTextName.value, room: entryTextRoom.value });
};

document.getElementById('entryButtonCreate').onclick = () => {
    socket.emit('userAttemptCreate', { name: entryTextName.value });
};

document.getElementById('leaveButton').onclick = () => {
    socket.emit('userAttemptLeave');
};

numMafia.onchange = () => { hostSelect(numMafia); };
numCops.onchange = () => { hostSelect(numCops); };
numDoctors.onchange = () => { hostSelect(numDoctors); };

document.getElementById('startButton').onclick = () => {
    socket.emit('startGame');
};

playAgainButton.onclick = () => {
    socket.emit('startGame');
};

endButton.onclick = () => {
    socket.emit('endGame');
}

function playerVote(playerName) {
    socket.emit('playerVote', { playerName: playerName });
}


// socket events
socket.on('joinSuccess', (data) => {
    savedUserInfo = data;
    roomHeader.innerHTML = "Room: " + data.room;
    divGame.style.display = "";
    divEntry.style.display = "none";
    clearEntry();
});

socket.on('leaveSuccess', () => {
    savedUserInfo = undefined;
    divEntry.style.display = "";
    divGame.style.display = "none";
});

socket.on('pushStateToClient', (roomState) => {
    console.log('pushStateToClient');
    // TODO: make sure not to print this in final product, as it would give game away
    console.log('STATE INCOMING');
    console.log(roomState);
    playerList.innerHTML = '';
    for (var name in roomState.clientState.players) {
        playerList.innerHTML += getPlayerBanner(roomState.clientState.players[name]);
    }
    setRoleHeader(roomState);
    stateMessage.innerHTML = roomState.clientState.message;
    setHostAndLobbyOptions(hostOptions, lobbyOptions, roomState, socket);
    setLeaveButtonVisible(roomState);
    setPlayAgainButtonVisible(playAgainButton, roomState, socket);
    setEndButtonVisible(endButton, roomState, socket);
});

socket.on('reconnect', () => {
    console.log('RECONNECT');
    socket.emit('userAttemptRejoin', savedUserInfo);
});

socket.on('clientConnected', (data) => {
    clearEntry();
    console.log('You are connected with socket: ' + data.socketId);
});
