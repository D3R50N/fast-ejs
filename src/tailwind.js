const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const { _p, _e, _w, _js, _ce, _r } = require("../core");
const { config, configTailwindOutput } = require("../core/lib");

const twConfigPath = "tailwind.config.js";
function loadUserTailwindConfig() {
  if (!_e(twConfigPath)) return null;

  const resolved = require.resolve(_p(twConfigPath));
  delete require.cache[resolved];

  return require(resolved);
}

function mergeTailwindConfig(base, user) {
  if (!user) return base;

  return {
    ...base,
    ...user,

    content: Array.from(
      new Set([...(base.content || []), ...(user.content || [])]),
    ),

    theme: {
      ...base.theme,
      ...user.theme,

      extend: {
        ...(base.theme?.extend || {}),
        ...(user.theme?.extend || {}),
      },
    },

    plugins: [...(base.plugins || []), ...(user.plugins || [])],
  };
}

function extractLayers(path) {
  const css = _r(path, false);
  if (!css) return {};
  const regex = /@layer\s+([a-zA-Z0-9_-]+)\s*\{([\s\S]*?\})\s*\}/g;
  const result = {};
  let match;

  while ((match = regex.exec(css)) !== null) {
    const name = match[1];
    const content = match[2].trim();

    result[name] ??= [];
    result[name].push(content);
  }

  return result;
}

async function buildTailwind() {
  const inputCss = path.join(__dirname, "../templates/tailwind.css");
  const outputCss = configTailwindOutput();

  const tracker = (dir, ext = "ejs,html") => {
    const oneExt = ext.split(",").length == 1;
    const suffix = oneExt ? ext : `{${ext}}`;

    return `./${dir}/**/*.${suffix}`;
  };
  const baseConfig = {
    darkMode: "class",
    content: [
      tracker(config.pages.dir),
      tracker(config.components.dir),
      tracker(
        config.data.dir,
        ["js", "json"].includes(config.data.allow)
          ? config.data.allow
          : "js,json",
      ),
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };

  if (!_e(twConfigPath))
    _w(
      twConfigPath,
      `/** @type {import('tailwindcss').Config} */
module.exports = ${_js(baseConfig)};
`,
    );

  const userConfig = loadUserTailwindConfig();
  const finalConfig = mergeTailwindConfig(baseConfig, userConfig);

  let css = fs.readFileSync(inputCss, "utf8");
  const tailwindOutput = path.dirname(configTailwindOutput());
  let imported = "";
  const layers = {};
  for (let style of config.tailwind.imports) {
    const uri_regex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (uri_regex.test(style)) {
      imported += `@import "${style}";\n`;
      continue;
    }
    const style_path = _p(`${config.build.output}/${style}`);
    const relative_path = path.relative(tailwindOutput, style_path);
    imported += `@import "./${relative_path}";\n`;

    const lay = extractLayers(`${config.pages.dir}/${style}`);
    for (let k in lay) {
      layers[k] ??= "";
      layers[k] += `${lay[k]}\n`;
    }
  }

  css = `${imported}\n${css}`;

  for (let k in layers) {
    css += `
@layer ${k} {
    ${layers[k]?.trim()}
}
`;
  }

  const result = await postcss([
    tailwindcss(finalConfig),
    autoprefixer(),
  ]).process(css, {
    from: inputCss,
    to: outputCss,
  });

  fs.mkdirSync(path.dirname(outputCss), { recursive: true });
  fs.writeFileSync(outputCss, result.css);
}

module.exports = buildTailwind;
