const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const {userSchema} = require("../validation/userSchema");
const prisma = require("../db/prisma");
const {randomUUID} = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict"
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = {id: user.id, csrfToken: randomUUID()};
  const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"}); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, {...cookieFlags(req), maxAge: 3600000}); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

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
  let newUser = null;
  value.hashedPassword = await hashPassword(value.password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      newUser = await tx.user.create({
        data: {
          name: value.name,
          email: value.email,
          hashedPassword: value.hashedPassword
        },
        select: {
          name: true,
          email: true,
          id: true
        }
      });
      const welcomeTasks = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium"
        },
        {title: "Add your first task", userId: newUser.id, priority: "high"},
        {title: "Explore the app", userId: newUser.id, priority: "low"}
      ];
      await tx.task.createMany({
        data: welcomeTasks
      });

      const getWelcomeTasks = await tx.task.findMany({
        where: {
          title: {
            in: welcomeTasks.map((t) => t.title)
          },
          userId: newUser.id
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true
        }
      });
      return {user: newUser, getWelcomeTasks};
    });

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.getWelcomeTasks,
      transactionStatus: "success",
      csrfToken: setJwtCookie(req, res, result.user)
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({
        error: "User with this email already exists"
      });
    } else {
      return next(err);
    }
  }
}

async function logon(req, res) {
  if (!req.body.email) {
    return res.status(401).send();
  }

  const email = req.body.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: {email},
    select: {id: true, name: true, email: true, hashedPassword: true}
  });

  if (user === null) {
    return res.status(401).send();
  }
  const goodCredentials = await comparePassword(
    req.body.password,
    user.hashedPassword
  );
  if (!goodCredentials) {
    return res.status(401).send();
  }

  return res.status(200).json({
    name: user.name,
    email: user.email,
    csrfToken: setJwtCookie(req, res, user)
  });
}

function logoff(req, res) {
  res.clearCookie("jwt", cookieFlags(req));
  return res.status(200).send();
}

async function show(req, res) {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({error: "Invalid user ID"});
  }

  if (userId !== global.user_id) {
    return res.status(403).json({error: "Forbidden"});
  }

  const user = await prisma.user.findUnique({
    where: {id: userId},
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: {isCompleted: false},
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }
    }
  });
  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }
  return res.status(200).json(user);
}

module.exports = {register, logon, logoff, show};
