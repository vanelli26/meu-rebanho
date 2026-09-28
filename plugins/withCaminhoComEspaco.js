const { withXcodeProject } = require('expo/config-plugins');

/**
 * O script "Bundle React Native code and images" do template executa o
 * caminho do react-native-xcode.sh sem aspas. Com espaço no caminho do
 * projeto (ex.: "Meu Rebanho") o build iOS falha. Troca por "$(...)".
 */
// No pbxproj o script fica como string com aspas escapadas (\").
const COMANDO =
  "\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"";
const ANTIGO = '`' + COMANDO + '`';
const NOVO = '\\"$(' + COMANDO + ')\\"';

module.exports = function withCaminhoComEspaco(config) {
  return withXcodeProject(config, (cfg) => {
    const fases = cfg.modResults.hash.project.objects.PBXShellScriptBuildPhase ?? {};
    for (const fase of Object.values(fases)) {
      if (typeof fase !== 'object' || typeof fase.shellScript !== 'string') continue;
      fase.shellScript = fase.shellScript.replace(ANTIGO, NOVO);
    }
    return cfg;
  });
};
