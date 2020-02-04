const fs = require(`fs`);
const path = require(`path`);

const GLOBAL_PATTERN = /{txt}/gi;
const RESOURCES = {};

const resourceDirs = {
  pages: path.join(__dirname, `../resources/pages`),
};

function getFiles(dirname) {
  try {
    return fs.readdirSync(dirname).map(name => ({
      baseDir: dirname,
      filename: name,
    }));
  } catch (error) {
    throw new Error(error);
  }
}

function isNotJSON(filename) {
  return !filename.match(/.json/i);
}

function readJSONObjects(resInfo, store = {}) {
  if (!resInfo.length) return store;
  if (isNotJSON(resInfo[0].filename)) {
    const newDir = `${resInfo[0].baseDir}/${resInfo[0].filename}`;
    if (fs.lstatSync(newDir).isDirectory()) {
      readJSONObjects([...resInfo.slice(1), ...getFiles(newDir)], store);
    } else {
      readJSONObjects(resInfo.slice(1), store);
    }
  } else {
    // eslint-disable-next-line
    store[resInfo[0].filename.replace(/.json/i, '')] = require(`${resInfo[0].baseDir}/${resInfo[0].filename}`);
    readJSONObjects(resInfo.slice(1), store);
  }
}

module.exports = {
  loadResources(type) {
    if (resourceDirs[type]) {
      if (!RESOURCES[type]) {
        RESOURCES[type] = {};
        readJSONObjects(getFiles(resourceDirs[type]), RESOURCES[type]);
        if (RESOURCES[type].global[Object.keys(RESOURCES[type].global)[0]] !== `[Function]`) {
          Object.entries(RESOURCES[type].global || {}).forEach(([elemName, xpath]) => {
            RESOURCES[type].global[elemName] = function (val) {
              return xpath.replace(GLOBAL_PATTERN, val);
            };
          });
        }
      }
      return RESOURCES[type];
    }
    throw new Error(`Resource type ${type} is not valid.`);
  },
};
