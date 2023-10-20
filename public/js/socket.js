const socket = io('http://localhost:8080');

socket.on('connect', () => {
	socket.on('recieveMessage', (data) => {
		const messageList = document.querySelector('#chatDiv')
		// const newMessage = document.createElement('p');
		// newMessage.innerHTML = `${data.username}: ${data.message}`

		// Deleting all messages
		messageList.innerHTML = '';	

		for (let i = 0; i < data.length; i++) {
			const newMessage = document.createElement('p');
			newMessage.innerHTML = `${data[i].username}: ${data[i].message}`
			messageList.appendChild(newMessage);
		}
	});
});

