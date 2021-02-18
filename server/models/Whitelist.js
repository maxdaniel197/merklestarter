const mongoose = require('mongoose');
const { Schema } = mongoose;

const WhitelistSchema = new Schema(
  {
    tranche: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
  },
  { collection: 'addresses' }
);

const Whitelist = mongoose.model('Whitelist', WhitelistSchema);

module.exports = Whitelist;
