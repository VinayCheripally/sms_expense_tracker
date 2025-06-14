const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Ensure proper handling of DeviceEventEmitter and native modules
config.resolver.sourceExts.push('cjs');

module.exports = config;