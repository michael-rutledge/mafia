const Hasher = require('./hasher');


var roomStates = {};
const ROOM_CODE_LENGTH = 4;


function reserveNewRoom() {
    var newRoom;
    do {
        newRoom = Hasher.genHash(ROOM_CODE_LENGTH);
    } while (roomStates[newRoom]);
    constructNewRoomState(newRoom);
    return newRoom;
}

function roomExists(room) {
    return roomStates.hasOwnProperty(room);
}

function addUserToRoom(socket, data) {
    return true;
}

function getRoomState(room) {
    return roomStates[room] ? roomStates[room] : constructNewRoomState(room);
}

function constructNewRoomState(room) {
    roomStates[room] = {
        gameState: 0,
        players: {},
        audience: []
    }
    return roomStates[room];
}

function removeRoom(room) {
    if (roomStates[room])
        delete roomStates[room];
}


module.exports.reserveNewRoom = reserveNewRoom;
module.exports.roomExists = roomExists;
module.exports.getRoomState = getRoomState;
module.exports.removeRoom = removeRoom;
