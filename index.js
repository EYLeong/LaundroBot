const request = require("request-promise-native");

const token = "926495483:AAGZB9EchLV2lsuVvN4nEcLoFh98UGWz3Lk";

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

// Send text to specified chatID
const sendMessage = async (chatID, text) => {
  const options = {
    uri: `https://api.telegram.org/bot${token}/sendMessage`,
    method: "POST",
    json: {
      chat_id: chatID,
      text: text
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

run();
