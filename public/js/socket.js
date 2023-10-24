// Importing socket.io
const socket = io('http://localhost:8080');

// Creating offensive message text
const offensiveMessageText = 'This message has been flagged as offensive'

/**
 * @param {int} messageId 
 * @param {string} username 
 * @returns Styled message author
 */
function createMessageAuthor(messageId, username) {
	return `<a href="/user/list/${messageId}">${username}</a>`

}

/**
 * @param {int} messageId 
 * @param {string} message 
 * @returns Styled message text
 */
function createMessageText(messageId, message) {
	return `${message}`
}

/**
 * @param {string} messagePfp 
 * @param {string} messageAuthor 
 * @param {string} messageText 
 * @returns Bundled message data
 */
function bundleAllMessageData(messagePfp, messageAuthor, messageText) {
	return `<span class="message-pfp">${messagePfp}</span><span class="message-author">${messageAuthor}</span>: <span class="message-text">${messageText}</span>`
}

function offensiveMessageFilter(event) {
	// Getting variables
	const message = event.target;
	const messageId = message.id;

	// Getting the wanted message Array
	messageObj = data[messageId-1];
	
	// Splitting the message to be only pfp
	messagePfp = message.innerHTML.split('a>')[0] + '>';

	// Setting the message author and text
	messageAuthor = createMessageAuthor(messageId, messageObj.username);
	messageText = createMessageText(messageId, messageObj.message);
	messageID = messageObj.msgID;
	
	// Setting the message to be offensive
	let overAllMessage;

	// If message is offensive, set it to inoffensive
	// If message is inoffensive, set it to offensive
	if (message.title == 'offensive') {
		overAllMessage = bundleAllMessageData(messagePfp, messageAuthor, offensiveMessageText);
		message.title = 'inoffensive';
	} else {
		overAllMessage = bundleAllMessageData(messagePfp, messageAuthor, messageText);
		message.title = 'offensive';
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
				newMessage.classList.add('offensiveMessage');

				newMessage.title = 'inoffensive'
				
				// Offensive message filter
				newMessage.addEventListener('click', (event) => offensiveMessageFilter(event));
			}
			
			// Setting the message id and class
			newMessage.id = data[i].msgID;
			newMessage.classList.add('messageChat');


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

	// Clearing the message input
	document.querySelector('[name="message"]').value = '';
});
