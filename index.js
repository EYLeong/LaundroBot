// Setup for telegram bot
const request = require("request-promise-native");
const tokenFile = require("./token.json");
const token = tokenFile.token;

// Setup for firebase
const admin = require("firebase-admin");

let serviceAccount = require("./laundromaniabot-339a3e027426.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

// https://api.telegram.org/bot<token>/METHOD_NAME http request syntax

// Check whether bot exists and is authorized with the given token
const authTest = async () => {
  let result = await request(`https://api.telegram.org/bot${token}/getMe`);
  console.log(result);
};

let lastUpdateId = 0; // Set to 0 to let the bot search for all available updates upon startup. Changed by the getUpdates method

// Get updates(messages) from chats
const getUpdates = async () => {
  const options = {
    uri: `https://api.telegram.org/bot${token}/getUpdates`,
    method: "POST",
    json: {
      allowed_updates: ["message"],
      timeout: 30, // polling time in seconds
      offset: lastUpdateId + 1 // start reading from next incoming update after the last one that was processed
    }
  };

  try {
    await request(options, (error, response, body) => {
      error && console.error(error); // If error with the http request
      console.log("Ok?", body.ok);
      for (let message of body.result) {
        // If multiple updates
        console.log("ChatID:", message.message.chat.id);
        console.log("Text:", message.message.text);
        lastUpdateId = message.update_id;
        sendMessage(
          message.message.chat.id,
          `You have sent the message ${message.message.text} to LaundroBot`
        );
      }
    });
  } catch (response) {
    // If promise rejected
    console.error("Error Code:", response.error.error_code);
    console.error("Desciption:", response.error.description);
  }
};

// Send text to specified chatID with optional keyboard
const sendMessage = async (chatID, text, keyboard = undefined) => {
  const options = {
    uri: `https://api.telegram.org/bot${token}/sendMessage`,
    method: "POST",
    json: {
      chat_id: chatID,
      text: text,
      reply_markup: keyboard
    }
  };

  try {
    await request(options, (error, response, body) => {
      error && console.error(error); // Error with http request
      console.log("Ok?", body.ok);
    });
  } catch (response) {
    // If promise rejected
    console.error("Error Code:", response.error.error_code);
    console.error("Desciption:", response.error.description);
  }
};

const run = async () => {
  while (true) {
    await getUpdates();
  }
};

// Get doc from firestore
const getDoc = async (collectionName, docName) => {
  let machineRef = db.collection(collectionName).doc(docName);
  try {
    let doc = await machineRef.get();
    if (!doc.exists) {
      console.error(
        `document ${docName} from collection ${collectionName} does not exist`
      );
    } else {
      console.log(doc.data());
    }
  } catch (error) {
    console.error(error);
  }
};

// Get collection from firestore
const getCollection = async collectionName => {
  let roomRef = await db.collection(collectionName);
  try {
    let collection = await roomRef.get();
    if (collection.empty) {
      console.error(`collection ${collectionName} does not exist or is empty`);
    } else {
      collection.forEach(doc => {
        console.log(doc.id, ":", doc.data());
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const listenDoc = (collectionName, docName) => {
  let docRef = db.collection(collectionName).doc(docName);

  docRef.onSnapshot(
    doc => {
      console.log(doc.data());
    },
    error => {
      console.error(error);
    }
  );
};

const listenCollection = collectionName => {
  let collectionRef = db.collection(collectionName);

  collectionRef.onSnapshot(
    collection => {
      collection.forEach(doc => {
        console.log(doc.id, ":", doc.data());
      });
    },
    error => {
      console.error(error);
    }
  );
};

sendMessage(244295884, "test", {
  keyboard: [["test1", "test2"]],
  one_time_keyboard: true
});
