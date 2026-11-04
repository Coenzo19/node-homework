const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const {userSchema} = require("../validation/userSchema");
const pool = require("../db/pg-pool");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  const {error, value} = userSchema.validate(req.body, {abortEarly: false});
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details
    });
  }
  let result = null;
  value.hashed_password = await hashPassword(value.password);

  try {
    result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password]
    );
  } catch (e) {
    // the email might already be registered
    if (e.code === "23505") {
      // this means the unique constraint for email was violated
      // here you return the 400 and the error message.  Use a return statement, so that
      // you don't keep going in this function
      return res.status(400).json({
        message: e.details
      });
    }
    return next(e); // all other errors get passed to the error handler
  }
  const user = result.rows[0];

  global.user_id = user.id;
  res.status(201).json({
    name: user.name,
    email: user.email
  });
}

async function logon(req, res) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    req.body.email
  ]);
  if (result.rows.length === 0) {
    return res.status(401).send();
  }
  const goodCredentials = await comparePassword(
    req.body.password,
    result.rows[0].hashed_password
  );
  if (!goodCredentials) {
    return res.status(401).send();
  }

  global.user_id = result.rows[0].id;
  return res.status(200).json({
    name: result.rows[0].name,
    email: result.rows[0].email
  });
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200).send();
}

module.exports = {register, logon, logoff};
