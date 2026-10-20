function register(req, res) {
  const newUser = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  };
  global.users.push(newUser);
  global.user_id = newUser;
  res.status(201).json({
    name: newUser.name,
    email: newUser.email
  });
}

function logon(req, res) {
  const user = global.users.find(
    (user) =>
      user.email === req.body.email && user.password === req.body.password
  );
  if (!user) {
    return res.status(401).send();
  }
  global.user_id = user;
  return res.status(200).json({
    name: user.name,
    email: user.email
  });
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200).send();
}

module.exports = { register, logon, logoff};
