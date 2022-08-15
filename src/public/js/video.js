const socket = io();

const myFace = document.getElementById("myFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        })
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstraints = {
        audio:true,
        video: {facingMode: "user"}
    };
    const cameraContraints = {
        audio:true,
        video: {deviceId: deviceId}
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraContraints : initialConstraints
            );
            myFace.srcObject = myStream;
            if(!deviceId) {
                await getCameras();
            }
    } catch(e) {
            console.log(e);
    }
}
    
muteButton.addEventListener("click", () => {
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    if(!muted) {
        muteButton.innerText = "Unmute";
        muted = true;
    } else {
        muteButton.innerText = "Mute";
        muted = false;
    }
});
cameraButton.addEventListener("click", () => {
    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if(!cameraOff) {
        cameraButton.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraButton.innerText = "Turn Camera Off";
        cameraOff = false;
    }
});
cameraSelect.addEventListener("input", () => {
    getMedia(cameraSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
});


//Welcome Form
const welcome = document.getElementById("welcome");
welcomeForm = welcome.querySelector("form");

async function startMedia() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

welcomeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await startMedia();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
});

// Socket Code

socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async offer => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

socket.on("answer", answer => {
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302"
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", (data) => {
        socket.emit("ice", data.candidate, roomName);
    });
    myPeerConnection.addEventListener("addstream", (data) => {
        const peerFace = document.getElementById("peerFace");
        peerFace.srcObject = data.stream;
    });
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

