// Setup for firebase
const admin = require("firebase-admin");

let serviceAccount = require("../laundromaniabot-339a3e027426.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

// Get doc from firestore
module.exports.getDoc = async (collectionName, docName) => {
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
module.exports.getCollection = async collectionName => {
  let roomRef = db.collection(collectionName);
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

// returns a square array of all the machines in a room
module.exports.machines2SqArr = async roomName => {
  const roomRef = db
    .collection("rooms")
    .doc("rooms")
    .collection(roomName);
  try {
    const collectionRef = await roomRef.get();
    let machineNames = [];
    collectionRef.forEach(docRef => machineNames.push(docRef.id));
    machineNames = arr2SqArr(machineNames);
    return machineNames;
  } catch (error) {
    console.error(error);
  }
};

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

module.exports.setNewUser = chatID => {
  db.collection("users")
    .doc(String(chatID))
    .set({ chatID: chatID });
};

module.exports.setUserRoom = (chatID, roomName) => {
  const userRef = db.collection("users").doc(String(chatID));
  userRef.update({ currentRoom: roomName });
};

module.exports.getUserRoom = async chatID => {
  const userRef = db.collection("users").doc(String(chatID));
  try {
    const doc = await userRef.get();
    const userData = doc.data();
    return userData.currentRoom;
  } catch (error) {
    console.error(error);
  }
};

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
