const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Block expo-sqlite on web platform completely
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'expo-sqlite' || moduleName.startsWith('expo-sqlite/'))) {
    return {
      filePath: __dirname + '/mock-expo-sqlite.js',
      type: 'sourceFile',
    };
  }
  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Also block any internal expo-sqlite imports
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'expo-sqlite/web/worker': require.resolve('./mock-expo-sqlite.js'),
  'expo-sqlite/web/wa-sqlite/wa-sqlite': require.resolve('./mock-expo-sqlite.js'),
  'expo-sqlite/web/wa-sqlite/wa-sqlite.wasm': require.resolve('./mock-wa-sqlite-wasm.js'),
  './wa-sqlite/wa-sqlite.wasm': require.resolve('./mock-wa-sqlite-wasm.js'),
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
