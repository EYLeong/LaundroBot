const request = require("request-promise-native");

const token = "926495483:AAHLGNpsN4LPb3I3sVTTWS-Yc9PDRo6h14I";

// https://api.telegram.org/bot<token>/METHOD_NAME

const getTest = async () => {
  let result = await request(`https://api.telegram.org/bot${token}/getMe`);
  console.log(result);
};
