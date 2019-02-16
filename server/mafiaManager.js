const Hasher = require('./hasher');


var roomStates = {};
const ROOM_CODE_LENGTH = 4;
const MAX_PLAYERS = 20;


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
    roomState = getRoomState(room);
    if (roomState) {
        // TODO: take player cap into account, whether game is on, etc
        if (!roomState.players[name]) {
            roomState.players[name] = {
                socketId: socket.id,
                role: 0,
                alive: true
            }
            roomState.socketNames[socket.id] = name;
            return true;
        }
    }
    return false;
}

function removeUserFromRoom(socket, room) {
    // TODO: this sucker needs a rehaul to do username check during active game
    roomState = getRoomState(room);
    if (roomState) {
        name = roomState.socketNames[socket.id];
        if (name !== undefined && roomState.players[name]) {
            delete roomState.players[name];
            delete roomState.socketNames[socket.id];
            return true;
        }
    }
    return false;
}

function getRoomState(room) {
    return roomStates[room];
}

function touchRoomState(room) {
    console.log('TOUCH ROOM STATE');
    return getRoomState(room) ? getRoomState(room) : constructNewRoomState(room);
}

function constructNewRoomState(room) {
    roomStates[room] = {
        gameState: 0,
        players: {},
        socketNames: {}
    }
    return roomStates[room];
}

function removeRoom(room) {
    if (getRoomState(room))
        delete roomStates[room];
}


module.exports.reserveNewRoom = reserveNewRoom;
module.exports.roomExists = roomExists;
module.exports.addUserToRoom = addUserToRoom;
module.exports.removeUserFromRoom = removeUserFromRoom;
module.exports.getRoomState = getRoomState;
module.exports.touchRoomState = touchRoomState;
module.exports.removeRoom = removeRoom;
