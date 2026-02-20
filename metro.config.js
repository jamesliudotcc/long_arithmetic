const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const aliases = {
	"@domain": path.resolve(__dirname, "src/domain"),
	"@infrastructure": path.resolve(__dirname, "src/infrastructure"),
	"@react": path.resolve(__dirname, "src/react"),
	"@web": path.resolve(__dirname, "src/web"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
	for (const [alias, aliasPath] of Object.entries(aliases)) {
		if (moduleName === alias || moduleName.startsWith(`${alias}/`)) {
			const resolved = aliasPath + moduleName.slice(alias.length);
			return context.resolveRequest(context, resolved, platform);
		}
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
