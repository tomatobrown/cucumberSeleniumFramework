const { setWorldConstructor } = require(`cucumber`);

const World = require(`./world`);

// handles UNABLE_TO_VERIFY_LEAF_SIGNATURE exception
process.env.NODE_TLS_REJECT_UNAUTHORIZED = `0`;
// base library

// overrides
setWorldConstructor(World);
