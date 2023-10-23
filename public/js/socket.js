// Importing socket.io
const socket = io('http://localhost:8080');

// Creating offensive message text
const offensiveMessageText = 'This message has been flagged as offensive'

function createMessageAuthor(messageId, username) {
	return `<a href="/user/list/${messageId}">${username}</a>`

}

function createMessageText(messageId, message) {
	return `${message}`
}

function bundleAllMessageData(messagePfp, messageAuthor, messageText) {
	return `${messagePfp}${messageAuthor}: ${messageText}`
}

function offensiveMessageFilter(event) {
	// Getting variables
	const message = event.target;
	const messageId = message.id;

	// Getting the wanted message Array
	messageArray = data[messageId-1];
	
	// Splitting the message to be only pfp
	messagePfp = message.innerHTML.split('a>')[0] + '>';

	// Setting the message author and text
	messageAuthor = createMessageAuthor(messageId, messageArray.username);
	messageText = createMessageText(messageId, messageArray.message);
	
	// Setting the message to be offensive
	let overAllMessage = bundleAllMessageData(messagePfp, messageAuthor, messageText);

	// If the message is already offensive, set it to innofensive
	console.log(`innerHTML: ${message.innerHTML}`);
	console.log(`overAllMessage: ${bundleAllMessageData(messagePfp, messageAuthor, messageText)}`);
	if (message.innerHTML == bundleAllMessageData(messagePfp, messageAuthor, messageText)) {
		let overAllMessage = bundleAllMessageData(messagePfp, messageAuthor, offensiveMessageText);
	}

	// Setting on client
	message.innerHTML = overAllMessage;
}

socket.on('connect', () => {
	socket.on('recieveMessage', (data) => {
		// Setting global variable
 		window.data = data
		
		const messageList = document.querySelector('#chatDiv')

		// Deleting all messages
		messageList.innerHTML = '';	

		for (let i = 0; i < data.length; i++) {
			const newMessage = document.createElement('p');

			// By default, the profile picture is anonymous
			let profilePicture = `<a href="/user/list/${data[i].id}"><img src="/profilePictures/Anonymous.png" width="30px" id="chatPFP"></a>`

			// If user is not Anonymous, setting the profile picture to the user's
			if (data[i].hasProfilePicture) {
				profilePicture = `<a href="/user/list/${data[i].id}"><img src="/profilePictures/${data[i].id}.png" width="30px" id="chatPFP"></a>`
			}

			// Getting variables
			let messageAuthor = createMessageAuthor(data[i].id, data[i].username);
			let messageText = createMessageText(data[i].id, data[i].message);
			let isOffensive = data[i].isOffensive;

			
			// Make it a bit more obvious that the message is offensive
			if (isOffensive) {
				messageText = offensiveMessageText;
				newMessage.style.color = 'red';
				newMessage.className = 'offensiveMessage';
				
				// Offensive message filter
				newMessage.addEventListener('click', (event) => offensiveMessageFilter(event));
			}
			
			newMessage.id = data[i].id;

			// Setting the message to be sent to the client
			overAllMessage = bundleAllMessageData(profilePicture, messageAuthor, messageText);
			newMessage.innerHTML = overAllMessage;

			// Adding the message to the message list
			messageList.appendChild(newMessage);
		}

		// Scrolling down
		document.querySelector('#chatDiv').scrollTop = document.querySelector('#chatDiv').scrollHeight;
	});
});

document.querySelector('[name="chatForm"]').addEventListener('submit', (event) => {
	// Preventing the form from refreshing the page
	event.preventDefault();

	const userToken = document.cookie.split('=')[1];
	const message = document.querySelector('[name="message"]').value;

	socket.emit('sendMessage', { userToken: userToken, message: message });
});
