module.exports = {

  // returns root app url
  getAppUrlForEnv(env) {
    switch (env.toLowerCase()) {
      case `local`:
        return `http://localhost:8000`;
      case `whatever`:
        return `https://www.whatever.com`;
      default:
        return `http://google.com`;
    }
  },
};
