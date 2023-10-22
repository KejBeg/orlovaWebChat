const socket = io('http://localhost:8080');

socket.on('connect', () => {
	socket.on('recieveMessage', (data) => {
		const messageList = document.querySelector('#chatDiv')
		console.log(`Recieved message array: ${data[0].id}`);

		// Deleting all messages
		messageList.innerHTML = '';	

		for (let i = 0; i < data.length; i++) {
			const newMessage = document.createElement('p');

			// By default, the profile picture is anonymous
			let profilePicture = '<img src="/profilePictures/Anonymous.png" width="30px" id="chatPFP">'

			// If user is not Anonymous, setting the profile picture to the user's
			if (data[i].username != 'Anonymous') {
				let profilePicture = `<img src="/profilePictures/${data[i].username}.png" width="30px" id="chatPFP">`
			}
			
			newMessage.innerHTML = `${profilePicture}${data[i].username}: ${data[i].message}`
			messageList.appendChild(newMessage);
		}
	});
});

document.querySelector('[name="send"]').addEventListener('click', () => {
	const userToken = document.cookie.split('=')[1];
	const message = document.querySelector('[name="message"]').value;

	socket.emit('sendMessage', { userToken: userToken, message: message });
});