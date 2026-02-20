const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
	"@domain": path.resolve(__dirname, "src/domain"),
	"@infrastructure": path.resolve(__dirname, "src/infrastructure"),
	"@react": path.resolve(__dirname, "src/react"),
	"@web": path.resolve(__dirname, "src/web"),
};

module.exports = config;
