const Promise = require(`bluebird`);
const fs = require(`fs`);
const _ = require(`lodash`);
const path = require(`path`);
const util = require(`util`);

const readFile = Promise.promisify(fs.readFile);
const stat = Promise.promisify(fs.stat);
const writeFile = Promise.promisify(fs.writeFile);

/**
 * Baseline writable resource directories
 */
const WRITABLE_RESOURCE_DIRECTORIES = [
  path.resolve(`./resources`),
  path.resolve(`../resources`),
  path.resolve(`../../resources`),
];
/**
 * Writable directories plus this module
 */
const READABLE_RESOURCE_DIRECTORIES = [
  ...WRITABLE_RESOURCE_DIRECTORIES,
  path.resolve(__dirname, `../resources`),
];

async function isDirectory(location) {
  try {
    const info = await stat(location);
    return info.isDirectory();
  } catch (error) {
    return false;
  }
}

function resolveResourceDirectories(pool) {
  return Promise.filter(pool, isDirectory);
}

async function resolveWritableDirectory(pool) {
  for (const location of pool) {
    if (await isDirectory(location)) {
      return location;
    }
  }
}

async function getResourceDirectories(loader) {
  if (!loader.resourceDirectories) {
    loader.resourceDirectories = await resolveResourceDirectories(loader.readablePool);
  }
  return loader.resourceDirectories;
}

async function getWritableDirectory(loader) {
  if (!loader.writableDirectory) {
    loader.writableDirectory = await resolveWritableDirectory(loader.writablePool);
  }
  return loader.writableDirectory;
}

class ResourceLoader {
  constructor({
    writableDirectories = WRITABLE_RESOURCE_DIRECTORIES,
    readableDirectories = READABLE_RESOURCE_DIRECTORIES,
  } = {}) {
    this.resourceDirectories = null;
    this.writableDirectory = null;

    this.readablePool = readableDirectories;
    this.writablePool = writableDirectories;
  }

  /**
  * Get and return the path of the first occurrence of a resource file, based on the order of
  * directories in `this.resourceDirectories` (closest to working directory by
  * default).
  */
  async getResourcePath(location) {
    const resourceDirectories = await getResourceDirectories(this);
    if (_.isEmpty(resourceDirectories)) {
      throw new Error(`No readable resource directories found or defined.`);
    }
    for (const directory of resourceDirectories) {
      try {
        const fullPath = path.join(directory, location);
        await fs.existsSync(fullPath);
        return fullPath;
      } catch (error) {
        // file does not exist or is not JSON
      }
    }
    throw new Error(`No valid resource "${location}" was found.`);
  }

  /**
  * Load and return the first occurrence of a JSON file, based on the order of
  * directories in `this.resourceDirectories` (closest to working directory by
  * default).
  */
  async loadResource(location) {
    const resourceDirectories = await getResourceDirectories(this);
    if (_.isEmpty(resourceDirectories)) {
      throw new Error(`No readable resource directories found or defined.`);
    }
    for (const directory of resourceDirectories) {
      try {
        return JSON.parse(await readFile(path.join(directory, location), `utf8`));
      } catch (error) {
        // file does not exist or is not JSON
      }
    }
    throw new Error(`No valid resource "${location}" was found.`);
  }

  /**
  * Save JSON to the designated writable directory (closest to working directory
  * by default).
  */
  async saveResource(location, contents) {
    const resourceDirectory = await getWritableDirectory(this);
    if (!resourceDirectory) {
      throw new Error(`No writable resource directory found or defined.`);
    }
    if (!_.isString(contents)) {
      contents = JSON.stringify(contents, null, 2);
    }
    return writeFile(path.join(resourceDirectory, location), contents);
  }
}

const singleton = new ResourceLoader();

module.exports = {
  ResourceLoader,
  loadResource: util.deprecate(location => singleton.loadResource(location), `resource.loadResource: Use loadResource on a ResourceLoader instance.`),
  saveResource: util.deprecate((location, contents) => singleton.saveResource(location, contents), `resource.saveResource: Use saveResource on a ResourceLoader instance.`),
};
