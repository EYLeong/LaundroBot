// Setup for firebase
const admin = require("firebase-admin");

let serviceAccount = require("../laundromaniabot-339a3e027426.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

// Listen to a doc for updates
module.exports.listenDoc = (collectionName, docName) => {
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

// Listen to a collection for updates
module.exports.listenCollection = collectionName => {
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

// returns a square array of all the rooms
module.exports.rooms2SqArr = async () => {
  try {
    return arr2SqArr(await this.getRoomNames());
  } catch (error) {
    console.error(error);
  }
};

// returns an array of the room names
module.exports.getRoomNames = async () => {
  const docRef = db.collection("rooms").doc("rooms");
  try {
    const collectionRefs = await docRef.listCollections();
    const collectionIds = collectionRefs.map(collectionRef => collectionRef.id);
    return collectionIds;
  } catch (error) {
    console.error(error);
  }
};

// returns an array of the status of the machines in a room. each status is an object
module.exports.getRoomStatus = async roomName => {
  const roomRef = db
    .collection("rooms")
    .doc("rooms")
    .collection(roomName);
  try {
    const collectionRef = await roomRef.get();
    let machines = [];
    collectionRef.forEach(docRef => machines.push(docRef.data()));
    return machines;
  } catch (error) {
    console.error(error);
  }
};

// sets a new user in the database based on chat id
module.exports.setNewUser = (chatID, currentRoom) => {
  db.collection("users")
    .doc(String(chatID))
    .set({ chatID: chatID, currentRoom: currentRoom });
};

module.exports.setUserProp = (chatID, property, value) => {
  const userRef = db.collection("users").doc(String(chatID));
  userRef.update({ [property]: value });
};

module.exports.getUserProp = async (chatID, property) => {
  const userRef = db.collection("users").doc(String(chatID));
  try {
    const doc = await userRef.get();
    const userData = doc.data();
    return userData[property];
  } catch (error) {
    console.error(error);
  }
};

module.exports.getUsers = async () => {
  const usersRef = db.collection("users");
  try {
    let output = [];
    const users = await usersRef.get();
    users.forEach(doc => {
      output.push(doc.data());
    });
    return output;
  } catch (error) {
    console.error(error);
  }
};

module.exports.listenRoom = async (
  roomName,
  sendMessage,
  respondRoomStatus
) => {
  const roomRef = db
    .collection("rooms")
    .doc("rooms")
    .collection(roomName);

  roomRef.onSnapshot(room => {
    let firstCheck = true;
    room.forEach(doc => {
      machine = doc.data();
      if (machine.status === "available" && firstCheck) {
        firstCheck = false;
        this.updateRoomAvail(
          roomName,
          machine.name,
          sendMessage,
          respondRoomStatus
        );
      } else if (machine.status === "awaiting collection") {
        this.updateMachineDone(
          roomName,
          machine.name,
          sendMessage,
          respondRoomStatus
        );
      }
    });
  });
};

module.exports.updateRoomAvail = async (
  roomName,
  machineName,
  sendMessage,
  respondRoomStatus
) => {
  try {
    const users = await this.getUsers();
    users.forEach(user => {
      if (user.waitingAvail === roomName) {
        sendMessage(user.chatID, `${machineName} is available!`);
        respondRoomStatus(user.chatID, roomName);
        this.setUserProp(user.chatID, "waitingAvail", "None");
      }
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.updateMachineDone = async (
  roomName,
  machineName,
  sendMessage,
  respondRoomStatus
) => {
  try {
    const users = await this.getUsers();
    users.forEach(user => {
      if (user.currentRoom === roomName && user.waitingDone === machineName) {
        sendMessage(user.chatID, "Your wash is done!");
        respondRoomStatus(user.chatID, roomName);
        this.setUserProp(user.chatID, "waitingDone", "None");
      }
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.getRunningSq = async roomName => {
  return arr2SqArr(await this.getRunning(roomName));
};

module.exports.getRunning = async roomName => {
  const status = await this.getRoomStatus(roomName);
  const output = [];
  status.forEach(machine => {
    machine.status === "running" && output.push(machine.name);
  });
  return output;
};

// convert an array into a square array.
const arr2SqArr = arr => {
  const rows = Math.floor(Math.sqrt(arr.length));
  const cols = Math.ceil(arr.length / rows);
  let outputSqArr = [];
  let counter = 0;
  for (let item of arr) {
    if (counter === 0) {
      outputSqArr.push([]);
      counter++;
    } else if (counter === cols - 1) {
      counter = 0;
    } else {
      counter++;
    }

    outputSqArr[outputSqArr.length - 1].push(item);
  }

  return outputSqArr;
};
