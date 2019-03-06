const Hasher = require('./hasher');
const RoomState = require('./roomState.js');
const Player = require('./player.js');

// management and constants
var roomStates = {};
const ROOM_CODE_LENGTH = 4;
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;


// public functions
function reserveNewRoom() {
    var newRoom;
    do {
        newRoom = Hasher.genHash(ROOM_CODE_LENGTH);
    } while (getRoomState(newRoom));
    constructNewRoomState(newRoom);
    return newRoom;
}

function roomExists(room) {
    return roomStates.hasOwnProperty(room);
}

function addUserToRoom(socket, name, room) {
    return roomExists(room) ? getRoomState(room).addUser(socket, name) : false;
}

function changeRoomOption(id, value, room) {
    return roomExists(room) ? getRoomState(room).changeOption(id, value) : false;
}

function playerVote(votingSocket, votedName, room) {
    return roomExists(room) ? getRoomState(room).playerVote(votingSocket, votedName) : false;
}

function removeUserFromRoom(socket, room) {
    return roomExists(room) ? getRoomState(room).removeUser(socket) : false;
}

function getRoomState(room) {
    return roomStates[room];
}

function touchRoomState(room) {
    console.log('TOUCH ROOM STATE');
    return roomExists(room) ? getRoomState(room) : constructNewRoomState(room);
}

function removeRoom(room) {
    if (roomExists(room))
        delete roomStates[room];
    console.log('ROOMS LEFT: ' + Object.keys(roomStates).length);
}

function startGame(socket, room) {
    return roomExists(room) ? getRoomState(room).startGame(socket) : false;
}


// private utilities
function constructNewRoomState(room) {
    roomStates[room] = new RoomState();
    return roomStates[room];
}

function transferToDaytime(roomState) {
    // for anyone selected by mafia and not saved by the doctor, kill them
    for (var name in roomState.players) {
        var player = roomState.players[name];
        if (player.mafiaTarget && !player.doctorTarget) {
            player.alive = false;
        }
        player.mafiaTarget = false;
        player.doctorTarget = false;
    }
}


// node exports
module.exports.reserveNewRoom = reserveNewRoom;
module.exports.roomExists = roomExists;
module.exports.addUserToRoom = addUserToRoom;
module.exports.changeRoomOption = changeRoomOption;
module.exports.removeUserFromRoom = removeUserFromRoom;
module.exports.playerVote = playerVote;
module.exports.getRoomState = getRoomState;
module.exports.touchRoomState = touchRoomState;
module.exports.removeRoom = removeRoom;
module.exports.startGame = startGame;
