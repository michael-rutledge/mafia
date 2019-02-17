// constants according to rules set in mafiaManger.js
const STATE_MESSAGES= [
    'Welcome to the lobby. Once enough players join and everyone readies up, the game will start',
    'It is now nighttime. Mafia, please choose your victim.',
    'Detective, please choose your suspect to investigate.',
    'Doctor, please who you would like to save.',
    'It is now daytime. Everyone, please deliberate and vote who to kill off.',
    'There are only two innocents left. We need a handshake to settle this...',
    'Game over. Vote on whether to play again or go to the lobby.'
];

// Create div element that represents player in game.
// User will know who they are by bolded name.
// Host will be italicized.
function genPlayerBanner(name, playerState, curSocket, host) {
    name = playerState.socketId === curSocket.id ? '<b>'+name+'</b>' : name;
    name = playerState.socketId === host ? '<i>'+name+'</i>' : name;
    return '<div class="playerBanner">' + name + '</div>';
}

function genStateMessage(gameState) {
    return STATE_MESSAGES[gameState];
}
