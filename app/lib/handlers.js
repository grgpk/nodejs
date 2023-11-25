/**
 * Request Handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Define the handlers
const handlers = {};

// Users
handlers.users = function (reqData, callback) {
  const acceptableMethods = ["get", "post", "put", "delete"];

  if (acceptableMethods.indexOf(reqData.method) > -1) {
    handlers._users[reqData.method](reqData, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (reqData, callback) {
  // Check that all required fields are filled out
  const firstName =
    typeof reqData.payload.firstName === "string" &&
    reqData.payload.firstName.trim().length > 0
      ? reqData.payload.firstName.trim()
      : false;

  const lastName =
    typeof reqData.payload.lastName === "string" &&
    reqData.payload.lastName.trim().length > 0
      ? reqData.payload.lastName.trim()
      : false;

  const phone =
    typeof reqData.payload.phone === "string" &&
    reqData.payload.phone.trim().length === 10
      ? reqData.payload.phone.trim()
      : false;

  const password =
    typeof reqData.payload.password === "string" &&
    reqData.payload.password.trim().length > 0
      ? reqData.payload.password.trim()
      : false;

  const tosAgreement =
    typeof reqData.payload.tosAgreement === "boolean" &&
    reqData.payload.tosAgreement === true
      ? reqData.payload.tosAgreement
      : false;

  if (firstName && lastName && password && phone && tosAgreement) {
    // Make sure that the user does not already exist
    _data.read("users", phone, function (err, data) {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create a user Object
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement,
          };

          // Store the user
          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        // User already exists
        callback(400, {
          Error: "A user with that phone number already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Users - put
handlers._users.put = function (reqData, callback) {};

// Users - get
handlers._users.get = function (reqData, callback) {};

// Users - delete
handlers._users.delete = function (reqData, callback) {};

// Ping handler
handlers.ping = function (reqData, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function (reqData, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;
