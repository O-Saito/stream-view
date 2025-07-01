const audios = {};

function createAudio(audioName, audioSrc) {
    const audio = new Audio();
    const src = document.createElement("source");
    //src.type = "audio/mpeg";
    src.src = audioSrc;
    audio.appendChild(src);
    audios[audioName] = audio;
    return audio;
}

createAudio("pei2", "/audios/pei2.mp3");
createAudio("follow", "/audios/umfollow.wav");
createAudio("invasion", "/audios/invasion.mp3");

const audioContext = new AudioContext();

export default {
    play: (audio) => {
        window.ac = audioContext;
        if (!audios[audio]) return false;
        //const track = audioContext.createMediaElementSource(audios[audio]);
        //track.connect(audioContext.destination);
        //track.play();
        console.log('play');
        audios[audio].play();
    },
    load: (audioName, audioSrc) => {
        audios[audioName] = new Audio(audioSrc);
    }
}