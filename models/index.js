const mongoose = require('mongoose');

const Smoke = require('./smoke');
const DATABASE_URL = "mongodb://localhost:27017/node-express-mongodb-server"

const connectDb = () => {
  return mongoose.connect(DATABASE_URL);
};

const models = { Smoke };

module.exports = {
  connectDb: connectDb,
  models: models
}