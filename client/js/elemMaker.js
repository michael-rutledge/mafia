// constants according to rules set in mafiaManger.js
const STATE_MESSAGES= [
    'Welcome to the lobby. Once enough players join, the host can start the game.',
    'Mafia, please choose your victim.',
    'Detective, please choose your suspect to investigate.',
    'Doctor, please choose who you would like to save.',
    'It is now daytime. Everyone, please deliberate and vote who to kill off.',
    'There are only two innocents left. We need a handshake to settle this...',
    'Game over. Vote on whether to play again or go to the lobby.'
];
const NIGHT_MESSAGE = 'You are currently asleep. But there are others out and about...';
// roles (must be consistent with serverside code in mafiaManager.js)
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;
const ROLES = [
    '',
    'Mafia',
    'Cop',
    'Doctor',
    'Town'
];
// game states (must be consistent with serverside code in mafiaManager.js)
const LOBBY         = 0;
const MAFIA_TIME    = 1;
const COP_TIME      = 2;
const DOCTOR_TIME   = 3;
const TOWN_TIME     = 4;
const SHOWDOWN      = 5;
const MAFIA_WIN     = 6;
const TOWN_WIN      = 7;


// Create div element that represents player in game.
// User will know who they are by bolded name.
// Host will be italicized in lobby.
function getPlayerBanner(name, roomState, curSocket) {
    var player = roomState.players[name];
    var curPlayer = roomState.players[roomState.socketNames[curSocket.id]];
    var divClass = 'bannerPlayer';
    var onclick = '';
    var bannerName = name;
    bannerName += player.socketId === null ? ' <i>(disconnected</i>)' : '';
    bannerName = player.socketId === curSocket.id ? '<b>'+bannerName+'</b>' : bannerName;
    bannerName = roomState.gameState === LOBBY && player.socketId === roomState.host ?
        '<i>'+bannerName+'</i>' : bannerName;
    switch (player.role) {
        case MAFIA:
            divClass += curPlayer.role === MAFIA ? ' bannerMafia' : ' bannerDefault';
            break;
        case COP:
            divClass += curPlayer.role === COP ? ' bannerCop' : ' bannerDefault';
            break;
        case DOCTOR:
            divClass += curPlayer.role === DOCTOR ? ' bannerDoctor' : ' bannerDefault';
            break;
        case TOWN:
            divClass += player.socketId === curPlayer.socketId ? ' bannerTown' : ' bannerDefault';
            break;
        default:
            divClass += ' bannerDefault';
            break;
    }
    divClass += !player.alive ? ' bannerDead' : '';
    if (playerIsVotable(roomState, player, curPlayer)) {
        divClass += ' bannerVotable';
        onclick = 'playerVote(\'' + name + '\')';
    }
    console.log('banner class: ' + divClass);
    return '<div class="'+divClass+'" onclick="'+onclick+'">' + bannerName + '</div>';
}

function getStateMessage(roomState, curSocket) {
    var ret = STATE_MESSAGES[roomState.gameState];
    var curPlayer = roomState.players[roomState.socketNames[curSocket.id]];
    switch (roomState.gameState) {
        case MAFIA_TIME:
            ret = curPlayer.role === MAFIA ? ret : NIGHT_MESSAGE;
            break;
        case COP_TIME:
            ret = curPlayer.role === COP ? ret : NIGHT_MESSAGE;
            break;
        case DOCTOR_TIME:
            ret = curPlayer.role === DOCTOR ? ret : NIGHT_MESSAGE;
            break;
        default:
            break;
    }
    return ret;
}

function setHostAndLobbyOptions(hoptions, loptions, state, curSocket) {
    hoptions.style.display = state.gameState === LOBBY && state.host === curSocket.id ?
        '' : 'none';
    loptions.style.display = state.gameState === LOBBY &&
        state.host !== curSocket.id ? '' : 'none';
    document.getElementById('lobbyHostLabel').innerHTML = 'Host: ' + state.socketNames[state.host];
    document.getElementById('lobbyMafiaLabel').innerHTML = 'Mafia: ' + state.numMafia;
    document.getElementById('lobbyCopsLabel').innerHTML = 'Cops: ' + state.numCops;
    document.getElementById('lobbyDoctorsLabel').innerHTML = 'Doctors: ' + state.numDoctors;
    document.getElementById('numMafia').value = state.numMafia;
    document.getElementById('numCops').value = state.numCops;
    document.getElementById('numDoctors').value = state.numDoctors;
}

function setLeaveButtonVisible(roomState) {
    // TODO: make sure leave button event cannot be triggered serverside in-game
    document.getElementById('leaveButton').style.display = roomState.gameState === LOBBY ?
        '' : 'none';
}

function setRoleHeader(roomState, curSocket) {
    document.getElementById('divRole').style.display = roomState.gameState === LOBBY ? 'none' : '';
    var curPlayer = roomState.players[roomState.socketNames[curSocket.id]];
    document.getElementById('roleHeader').innerHTML = curPlayer.alive ?
        'Your role: ' + ROLES[curPlayer.role] : 'You are dead. :( All roles are now visible.';
}


// utility and helper functions
function playerIsVotable(roomState, player, curPlayer) {
    // dead people should not be votable and should not vote either
    if (!curPlayer.alive || !player.alive) {
        return false;
    }
    switch (roomState.gameState) {
        // mafia can vote for anyone, even themselves
        case MAFIA_TIME:
            return curPlayer.role === MAFIA;
            break;
        // cops can only investigate non-cops who haven't been investigated
        case COP_TIME:
            return curPlayer.role === COP && player.role !== COP &&
                player.copResult === null;
            break;
        // doctors can only save non-doctors
        case DOCTOR_TIME:
            return curPlayer.role === DOCTOR && player.role !== DOCTOR;
            break;
        // during deliberation, everyone can vote on anyone
        case TOWN_TIME:
            return true;
            break;
        default:
            return false;
            break;
    }
}
