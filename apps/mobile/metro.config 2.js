const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const resolveSingleton = (name) => {
  const local = path.resolve(projectRoot, 'node_modules', name);
  const root = path.resolve(workspaceRoot, 'node_modules', name);
  return require('fs').existsSync(local) ? local : root;
};

const singletons = ['react', 'react-dom', 'react-native', 'scheduler', 'use-sync-external-store'];
config.resolver.extraNodeModules = singletons.reduce((acc, name) => {
  acc[name] = resolveSingleton(name);
  return acc;
}, {});

module.exports = withNativeWind(config, { input: './global.css' });
