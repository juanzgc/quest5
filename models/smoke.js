const mongoose = require('mongoose');

const smokeSchema = new mongoose.Schema({
  Temp: Number,
  Smoke: { type: Number, enum: [0, 1] },
  ID: { type: Number, enum: [0, 1] },
  Time: Number
});
const Smoke = mongoose.model('Smoke', smokeSchema);

module.exports = Smoke;