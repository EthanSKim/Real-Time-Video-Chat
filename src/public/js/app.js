const socket = io();

const header = document.querySelector("header");
const welcome = document.getElementById("welcome");
const roomForm = welcome.querySelector("#roomName");
const nameForm = welcome.querySelector("#name");
const room = document.getElementById("room");

room.hidden = true;

let roomName;
let nickName;

function addMessage(message, user) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    if(user) {
        li.className = "user";
    } else {
        li.className = "friend";
    }
    ul.appendChild(li);
}

nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = nameForm.querySelector("input");
    socket.emit("nickname", input.value, () => {
        nameForm.hidden = true;
        const h5 = welcome.querySelector("h5");
        h5.innerText = `Welcome, ${input.value}`;
    });
});

roomForm.addEventListener("submit", (event)=> {
    event.preventDefault();
    const input = roomForm.querySelector("input");
    socket.emit("enter_room", input.value, ()=>{
        welcome.hidden = true;
        header.hidden = true;
        room.hidden = false;
        const h3 = room.querySelector("h3");
        h3.innerText = `Room ${roomName}`;
        const msgForm = room.querySelector("#msg");
        msgForm.addEventListener("submit", (event)=> {
            event.preventDefault();
            const input = room.querySelector("#msg input");
            socket.emit("new_message", input.value, roomName, () => {
                addMessage(`${input.value}`, true);
                input.value = "";
            });
        });
    });
    roomName = input.value;
    input.value = "";
});

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} Joined!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left :(`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
    roomList.innerHTML = "";
    if(rooms.length === 0) {
        return;
    }
    const roomList = welcome.querySelector("ul");
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});
