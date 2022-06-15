$(function() {
    //make connection
    let socket = io.connect('http://localhost:5000');

    //buttons and inputs
    let message = $("#message");
    let username = $("#username");
    let send_username = $("#send_username");
    let chatroom = $("#chatroom");
    let feedback = $("#feedback");

    const chatBox = document.querySelector('.chat-box');
    const chatForm = document.querySelector('.chat-form');
    const userContact = document.querySelector('.user-name');
    const addContact = document.querySelector('.add-contact');
    const modal = document.querySelector('#modal');
    const modalClose = document.querySelector('.modal-close');

    
    addContact.onclick = () => {
        modal.classList.add("active");
    };
    modalClose.onclick = () => {
        modal.classList.remove("active");

    };
    let publicKey = {
        p: 0,
        g: 0
    };

    let secretKey = Math.floor(Math.random() * (1000 - 1)) + 1;
    let key = 0;


    socket.on('get_public_key', (data) => {
        publicKey = data;
        console.log('public key');
        console.log(publicKey);
        console.log("secret key: " + secretKey);
    });

    socket.on('get_key', (data) => {
        let num = 1;

        for (let i = 0; i < secretKey; i++) {
            num *= publicKey.g;
            num %= publicKey.p;
        }
        console.log('Key which is shared to all clients: ' + num)
        socket.emit('get_key', num);
    });

    socket.on('send_key', (data) => {
        key = 1;
        console.log("Key received from another client: "+data)
        for (let i = 0; i < secretKey; i++) {
            key *= data;
            key %= publicKey.p;
        }

        console.log(`Key to encode anh decode: ${key}`);
    });

    //Emit message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let text = message.val();
        console.log(text)
        let encryptedText = CryptoJS.AES.encrypt(text, key.toString()).toString();
        console.log(encryptedText);
        message.val('');
        socket.emit('new_message', { message: encryptedText });
    });

    //Listen on new_message
    socket.on("new_message", (data) => {
        if (data.message !== '' && data.username !== userContact.innerText) {
            let decryptedText = CryptoJS.AES.decrypt(data.message, key.toString()).toString(CryptoJS.enc.Utf8);
            var chatItem = document.createElement('li');
            chatItem.classList.add('user-2');
            var divChat = document.createElement('div');
            divChat.classList.add('text-user-2');
            divChat.innerText = decryptedText;
            chatItem.appendChild(divChat);
            chatBox.appendChild(chatItem);
        } else if (data.message !== '' && data.username === userContact.innerText) {
            let decryptedText = CryptoJS.AES.decrypt(data.message, key.toString()).toString(CryptoJS.enc.Utf8);
            var chatItem = document.createElement('li');
            chatItem.classList.add('user-1');
            var divChat = document.createElement('div');
            divChat.classList.add('text-user-1');
            divChat.innerText = decryptedText;
            chatItem.appendChild(divChat);
            chatBox.appendChild(chatItem);
        }
    });

    socket.on("disconnected", (data) => {
        chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
    });

    //Emit a username
    send_username.click(function() {
        userContact.innerText = username.val();
        modal.classList.remove("active");
        socket.emit('change_username', { username: username.val() })
    });

    //Emit typing
    message.bind("keypress", () => {
        socket.emit('typing')
    });

    //Listen on typing
    socket.on('typing', (data) => {
        feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>")
    });
});