const CacheManager = require('./cachemanager.js')
const ConfigManager = require('./configmanager.js')

// Ensure the data directory exists.
CacheManager.ensureDirectoryExists()

// Load the configuration values.
ConfigManager.load()