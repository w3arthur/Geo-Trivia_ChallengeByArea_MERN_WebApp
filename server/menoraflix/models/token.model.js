
const { mongoose, mongooseMenora, schemaVersion } = require("../../connection");

const TokenSchema = new mongoose.Schema({
  schemaVersion: schemaVersion
  , name: { type: String, trim: true, index: true, required: true }
  , accessToken: { type: String, trim: true, index: true }
  , refreshToken: { type: String, index: true, trim: true, required: true }
}, { timestamps: true, })

//UserSchema.index({});

const TokenModel = mongooseMenora.model(
  "Token"  //tokens
  , TokenSchema
);

module.exports = TokenModel;
