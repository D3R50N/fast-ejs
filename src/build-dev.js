const { args, _d, _p } = require("../core");
const ejsbuild = require("../src/build");
const nodemon = require("nodemon");
const { config } = require("../core/lib");

async function ejsbuild_dev() {
  const toWatch = [
    config.pages.dir,
    config.components.dir,
    config.data.dir,
    ".env",
  ];

  _d("Watching :", toWatch.map((d) => `'${d}'`).join(", "));
  await ejsbuild(); // needs await to get config

  nodemon({
    watch: toWatch.map(_p),
    ignore: [],
    delay: config.build.interval,
    ext: "*",
  });

  nodemon.on("restart", (files) => {
    ejsbuild(1);
  });

  nodemon.on("quit", () => {
    _d("Session ended 🛑");
    process.exit();
  });
}

module.exports = ejsbuild_dev;
