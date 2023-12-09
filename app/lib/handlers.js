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
      const token =
        typeof reqData.headers.token === "string"
          ? reqData.headers.token
          : false;

      // Verify that the given token from the headers is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
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
          callback(403, {
            Error: "Missing required token in header or token is invalid",
          });
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
handlers._users.get = function (reqData, callback) {
  // Check that the phone number provided is valid
  const phone =
    typeof reqData.queryStringObject.phone === "string" &&
    reqData.queryStringObject.phone.trim().length === 10
      ? reqData.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Get the token from the headers
    const token =
      typeof reqData.headers.token === "string" ? reqData.headers.token : false;

    // Verify that the given token from the headers is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "Missing required token in header or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - delete
// Required field: phone
handlers._users.delete = function (reqData, callback) {
  // Check that the phone number provided is valid
  const phone =
    typeof reqData.queryStringObject.phone === "string" &&
    reqData.queryStringObject.phone.trim().length === 10
      ? reqData.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Get the token from the headers
    const token =
      typeof reqData.headers.token === "string" ? reqData.headers.token : false;

    // Verify that the given token from the headers is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "Missing required token in header or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Tokens
handlers.tokens = function (reqData, callback) {
  const acceptableMethods = ["get", "post", "put", "delete"];

  if (acceptableMethods.indexOf(reqData.method) > -1) {
    handlers._tokens[reqData.method](reqData, callback);
  } else {
    callback(405);
  }
};

// * COntainer for all the tokens methods
handlers._tokens = {};

// * tokens - post
// * Required data: phone and password
handlers._tokens.post = function (reqData, callback) {
  // Check for the required field
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

  if (phone && password) {
    // Lookup the user who matches the phone number
    _data.read("users", phone, function (err, userData) {
      if (!err && userData) {
        // hash the password and compare it to the password from user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // If valid create a new token with a random name. Set expiration date one hour in future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            id: tokenId,
            phone,
            expires,
          };

          // store the token
          _data.create("tokens", tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, {
            Error: "Password did not match the specified users password",
          });
        }
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// * tokens - get
// * required data - id
handlers._tokens.get = function (reqData, callback) {
  const id =
    typeof reqData.queryStringObject.id === "string" &&
    reqData.queryStringObject.id.trim().length === 20
      ? reqData.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// * tokens - put
// * required data: id, extend
handlers._tokens.put = function (reqData, callback) {
  // Check for the required field
  const id =
    typeof reqData.payload.id === "string" &&
    reqData.payload.id.trim().length === 20
      ? reqData.payload.id.trim()
      : false;

  const extend =
    typeof reqData.payload.extend === "boolean" &&
    reqData.payload.extend === true
      ? reqData.payload.extend
      : false;

  if (id && extend) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        // check if token is not already expired
        if (tokenData.expires > Date.now()) {
          // set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // store the new updates
          _data.update("tokens", id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token's expiration",
              });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired, cannot be extended",
          });
        }
      } else {
        callback(400, { Error: "Specified token does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// * tokens - delete
// * required data: id
handlers._tokens.delete = function (reqData, callback) {
  // Check that the id provided is valid
  const id =
    typeof reqData.queryStringObject.id === "string" &&
    reqData.queryStringObject.id.trim().length === 20
      ? reqData.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the user
    _data.read("tokens", id, function (err, data) {
      if (!err && data) {
        _data.delete("tokens", id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
  // Lookup the token
  _data.read("tokens", id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
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
