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

module.exports.rooms2SqArr = async () => {
  try {
    const collectionRefs = await db.listCollections();
    const collectionIds = collectionRefs.map(collectionRef => collectionRef.id);

    return arr2SqArr(collectionIds);
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
