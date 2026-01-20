const { args, _r, _has, _ce, _d, _w, _md, _e, _p, _ds } = require(".");
const { $confirm, $input, $select, $number } = require("./prompter");
const default_fej = require("../fast.ejs.json");
const config = {
  ...default_fej,
  $schema: "http://unpkg.com/fast-ejs-builder/fast.ejs.schema.json",
};

function getConfigFile() {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.toLowerCase() == "-c" || arg == "--config") {
      const v = args[i + 1];
      if (v) return v;
    }
  }
}

function smartMerge(target = {}, source = {}) {
  if (!source) return target;

  const result = { ...target };

  for (const key in target) {
    const targetValue = target[key];
    const sourceValue = source[key];

    const exists = (val) =>
      val != null && val != undefined && val.toString().trim() != "";

    const isObject = (val) =>
      val && typeof val === "object" && !Array.isArray(val);

    if (isObject(targetValue) && isObject(sourceValue)) {
      result[key] = smartMerge(targetValue, sourceValue);
    } else if (
      exists(sourceValue) &&
      typeof targetValue === typeof sourceValue
    ) {
      result[key] = sourceValue;
    }
  }

  return result;
}

async function getConfig() {
  const file = getConfigFile() || "fast.ejs.json";

  if (!_ce(file, "Config file")) {
    const auto = await $confirm("Do you want to use default settings ?", true);
    if (!auto) {
      config.pages.dir = await $input(
        "Where are your pages ?",
        config.pages.dir,
      );
      config.data.dir = await $input(
        "Where are your data files ?",
        config.data.dir,
      );
      config.components.dir = await $input(
        "In which folder are your components ?",
        config.components.dir,
      );

      config.build.output = await $input(
        "Where do you want to output ?",
        config.build.output,
      );
      config.build.interval = await $number(
        "How many milliseconds between each build ?",
        config.build.interval,
      );
      config.build.useIndexRouting = await $confirm(
        "Do you want to use index routing ?",
        true,
      );
      config.data.allow = await $select(
        "In which format do you want to pass data ?",
        ["all", "js", "json"],
        config.data.allow,
      );

      config.tailwind.output = await $input(
        "Where should tailwind output ?",
        config.tailwind.output,
      );
    }
    const done = _w(file, config);
    if (done) _ds(`Successfully generated '${file}'`);
  }

  const user_config = _r(file);
  const merged_config = smartMerge(config, user_config);

  for (let k in merged_config) {
    config[k] = merged_config[k];
  }
}

function generateBaseDirs() {
  if (!_ce(config.pages.dir, "Pages directory")) {
    _md(config.pages.dir);
    _d("Generated pages directory.");
  }
  _md(config.pages.dir + "/public");

  if (!_ce(config.components.dir, "Components directory")) {
    _md(config.components.dir);
    _d("Generated components directory.");
  }
  if (!_ce(config.data.dir, "Data directory")) {
    _md(config.data.dir);
    _d("Generated data directory.");
  }
}

async function getDatas() {
  const globalDataPath = (type) => `${config.data.dir}/global.data.${type}`;
  const localDataPath = (type) => `${config.data.dir}/local.data.${type}`;

  const globalJs = globalDataPath("js");
  const globalJson = globalDataPath("json");

  const localJs = localDataPath("js");
  const localJson = localDataPath("json");

  const templates = {
    globalJS: `
module.exports = async () => ({
  year: new Date().getFullYear(),
  environment: process.env.NODE_ENV,
});
`,
    localJS: `
module.exports = () => ({
  // index.ejs
  index: {
    title: process.env.APP_NAME,
  },
  about: {}, // about.ejs,
  "contact/menu": {}, // contact/menu.ejs
});
`,
  };

  const default_data_args = {};

  const parseJSDate = async (path) => {
    const resolved = require.resolve(_p(path));
    delete require.cache[resolved];
    const v = require(resolved);
    return typeof v == "function" ? await v(default_data_args) : v;
  };

  const getGlobalJSData = async () => {
    if (_e(globalJs)) {
      return await parseJSDate(globalJs);
    } else {
      _d(`Global file '${globalJs}' not found. It will be generated`);
      _w(globalJs, templates.globalJS.trim());
      return {};
    }
  };

  const getLocalJSData = async () => {
    if (_e(localJs)) {
      return await parseJSDate(localJs);
    } else {
      _d(`Local file '${localJs}' not found. It will be generated`);
      _w(localJs, templates.localJS.trim());
      return {};
    }
  };

  const getGlobalJSONData = () => {
    if (_e(globalJson)) {
      return _r(globalJson);
    } else {
      _d(`Global file '${globalJson}' not found. It will be generated`);
      _w(globalJson, {});
      return {};
    }
  };

  const getLocalJSONData = () => {
    if (_e(localJson)) {
      return _r(localJson);
    } else {
      _d(`Local file '${localJson}' not found. It will be generated`);
      _w(localJson, { index: { title: "HomePage" }, about: {} });
      return {};
    }
  };

  let globalData = {},
    localData = {};

  switch (config.data.allow) {
    case "js":
      globalData = await getGlobalJSData();
      localData = await getLocalJSData();
      break;
    case "json":
      globalData = getGlobalJSONData();
      localData = getLocalJSONData();
      break;
    default:
      globalData = { ...getGlobalJSONData(), ...(await getGlobalJSData()) };
      localData = { ...getLocalJSONData(), ...(await getLocalJSData()) };
      break;
  }

  return { globalData, localData };
}

const configTailwindOutput = () => {
  let o = config.tailwind.output;
  if (!o.startsWith("/")) o = `/${o}`;

  return _p(config.build.output + o);
};

module.exports = {
  getConfigFile,
  getConfig,
  generateBaseDirs,
  config,
  configTailwindOutput,
  getDatas,
};
