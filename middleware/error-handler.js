function errorHandler(err, req, res, next) {
  return res.status(500).json({
    message: "Something went wrong."
  });
}

module.exports = {errorHandler};
