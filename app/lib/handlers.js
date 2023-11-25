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
// Required data: phone
// Optional data: firstname, lastname, password (at least one must be specified)
// @TODO - only let an authenticated user update their object
handlers._users.put = function (reqData, callback) {
  // Check for the required field
  const phone =
    typeof reqData.payload.phone === "string" &&
    reqData.payload.phone.trim().length === 10
      ? reqData.payload.phone.trim()
      : false;

  // Check for the optional
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

  const password =
    typeof reqData.payload.password === "string" &&
    reqData.payload.password.trim().length > 0
      ? reqData.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read("users", phone, function (err, userData) {
        if (!err && userData) {
          // Update the fields necessary
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }
          // Store the new updates
          _data.update("users", phone, userData, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not update the user" });
            }
          });
        } else {
          callback(400, { Error: "The specified user does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Required field is missing" });
  }
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object
handlers._users.get = function (reqData, callback) {
  // Check that the phone number provided is valid
  const phone =
    typeof reqData.queryStringObject.phone === "string" &&
    reqData.queryStringObject.phone.trim().length === 10
      ? reqData.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Lookup the user
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        // Remove the hashed password from the user object before returning it to the requester
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - delete
// Required field: phone
// TODO - Only let an authenticated user delete their object
// TODO - Cleanuo (delete) any other data files associated with this user
handlers._users.delete = function (reqData, callback) {
  // Check that the phone number provided is valid
  const phone =
    typeof reqData.queryStringObject.phone === "string" &&
    reqData.queryStringObject.phone.trim().length === 10
      ? reqData.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Lookup the user
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        _data.delete("users", phone, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified user" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

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
