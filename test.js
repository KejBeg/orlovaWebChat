if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const crypto = require('crypto');

function encryptPassword(password) {
	try {
		// Generating salt
		const passwordSalt = crypto
			.randomBytes(parseInt(process.env.PASSWORD_SALT_BITS))
			.toString('hex');

		// Generating password hash
		const passwordHash = crypto
			.pbkdf2Sync(
				password,
				passwordSalt,
				parseInt(process.env.PASSWORD_ITERATION_LIMIT),
				parseInt(process.env.PASSWORD_KEY_LENGTH),
				process.env.PASSWORD_ENCRYPTION_ALGORITHM
			)
			.toString('hex');

		// Return the encrypted password
		return `${passwordHash}.${passwordSalt}`;
	} catch (error) {
		console.log(`An error occured while encrypting a password: ${error}`);
	}
}

function verifyPassword(databasePassword, loginPassword) {
	try {
		// Split the password hash and salt
		const [passwordHash, passwordSalt] = databasePassword.toString().split('.');

		const hashedPasswordBuf = Buffer.from(passwordHash, 'hex');
		const suppliedPasswordBuf = crypto.pbkdf2Sync(
			loginPassword,
			passwordSalt,
			parseInt(process.env.PASSWORD_ITERATION_LIMIT),
			parseInt(process.env.PASSWORD_KEY_LENGTH),
			process.env.PASSWORD_ENCRYPTION_ALGORITHM
		);

		// Return true if passwords match, false if they don't
		return crypto.timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
	} catch (error) {
		console.log(`An error occured while verifying a password: ${error}`);
	}
}

const passwordToEncrypt = 'test1234';

const encryptedPassword = encryptPassword(passwordToEncrypt);

console.log(`encrypted password: ${encryptedPassword}`);

console.log(`incorrect password ${verifyPassword(encryptedPassword, 'fake')}`);
console.log(
	`correct password ${verifyPassword(encryptedPassword, passwordToEncrypt)}`
);
