const fire = require("./functions/firestore");

// Setup for telegram bot
const request = require("request-promise-native");
const tokenFile = require("./token.json");
const token = tokenFile.token;

// https://api.telegram.org/bot<token>/METHOD_NAME http request syntax

// Check whether bot exists and is authorized with the given token
const authTest = async () => {
  let result = await request(`https://api.telegram.org/bot${token}/getMe`);
  console.log(result);
};

let lastUpdateId = 0; // Set to 0 to let the bot search for all available updates upon startup. Changed by the getUpdates method

// Get updates(messages) from chats and respond
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
        const chatID = message.message.chat.id;
        const messageText = message.message.text;

        console.log("ChatID:", chatID);
        console.log("Text received:", messageText);
        lastUpdateId = message.update_id;

        respond(chatID, messageText);
      }
    });
  } catch (response) {
    // If promise rejected
    console.error("Error Code:", response.error.error_code);
    console.error("Desciption:", response.error.description);
  }
};

// Send text to specified chatID with optional keyboard and parse_mode
const sendMessage = async (
  chatID,
  text,
  keyboard = undefined,
  parse_mode = undefined
) => {
  const options = {
    uri: `https://api.telegram.org/bot${token}/sendMessage`,
    method: "POST",
    json: {
      chat_id: chatID,
      text: text,
      reply_markup: keyboard,
      parse_mode: parse_mode
    }
  };

  try {
    await request(options, (error, response, body) => {
      error && console.error(error); // Error with http request
      console.log("Ok?", body.ok);
      console.log("ChatID:", chatID);
      console.log("Text sent:", text);
    });
  } catch (response) {
    // If promise rejected
    console.error("Error Code:", response.error.error_code);
    console.error("Desciption:", response.error.description);
  }
};

// Respond with the status of the machines in the room
const respondRoomStatus = async (chatID, roomName) => {
  const status = await fire.getRoomStatus(roomName);
  let outString = `*${roomName} machines*\n\n`;
  status.forEach(machine => {
    outString += `${machine.name}: ${machine.status}\n`;
  });
  const keyboard = {
    keyboard: [
      ["Refresh"],
      ["Notify me when a machine is available"],
      ["Notify me when my wash is done"]
    ],
    one_time_keyboard: true
  };
  sendMessage(chatID, outString, keyboard, "Markdown");
};

// Respond to /start
const respondStart = async chatID => {
  const keyboard = {
    keyboard: await fire.rooms2SqArr(),
    one_time_keyboard: true
  };
  sendMessage(
    chatID,
    "Which laundry room would you like to monitor?",
    keyboard
  );
};

// Respond to Refresh
const respondRefresh = async chatID => {
  const roomName = await fire.getUserProp(chatID, "currentRoom");
  respondRoomStatus(chatID, roomName);
};

// Respond to notify me when a machine is available
const respondNotifyAvailable = async chatID => {
  const roomName = await fire.getUserProp(chatID, "currentRoom");
  const status = await fire.getRoomStatus(roomName);
  let availCheck = false;
  status.forEach(machine => {
    machine.status === "available" && (availCheck = true);
  });
  if (availCheck) {
    sendMessage(chatID, "There is already a machine available!");
    respondRoomStatus(chatID, roomName);
  } else {
    sendMessage(
      chatID,
      "We will notify you when there is a machine available!"
    );
    fire.setUserProp(chatID, "waitingAvail", roomName);
  }
};

const respondWashDone = async chatID => {
  const roomName = await fire.getUserProp(chatID, "currentRoom");
  const runningMachines = await fire.getRunningSq(roomName);
  if (!runningMachines.length) {
    sendMessage(chatID, "There are no running machines!");
    respondRoomStatus(chatID, roomName);
  } else {
    const keyboard = {
      keyboard: runningMachines,
      one_time_keyboard: true
    };
    sendMessage(chatID, "Which machine?", keyboard);
  }
};

const respondWashDoneMachine = async (chatID, machine) => {
  fire.setUserProp(chatID, "waitingDone", machine);
  sendMessage(chatID, "We will notify you when your wash is done!");
};

// Overall response
const respond = async (chatID, messageText) => {
  if (messageText === "/start") {
    respondStart(chatID);
  } else if (messageText === "Refresh") {
    respondRefresh(chatID);
  } else if (messageText === "Notify me when a machine is available") {
    respondNotifyAvailable(chatID);
  } else if (messageText === "Notify me when my wash is done") {
    respondWashDone(chatID);
  } else {
    const roomNames = await fire.getRoomNames();
    if (roomNames.includes(messageText)) {
      fire.setNewUser(chatID, messageText);
      respondRoomStatus(chatID, messageText);
    } else {
      const runningMachines = await fire.getRunning(
        await fire.getUserProp(chatID, "currentRoom")
      );
      if (runningMachines.includes(messageText)) {
        respondWashDoneMachine(chatID, messageText);
      } else {
        sendMessage(chatID, `Unknown command ${messageText} received by bot`);
      }
    }
  }
};

const test = async () => {
  console.log(await fire.getUserProp(244295884, "currentRoom"));
};

const run = async () => {
  fire.listenRoom("fakeroom1", sendMessage, respondRoomStatus);
  fire.listenRoom("fakeroom2", sendMessage, respondRoomStatus);
  while (true) {
    await getUpdates();
  }
};

run();
// test();
