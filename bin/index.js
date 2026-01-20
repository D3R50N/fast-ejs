#!/usr/bin/env node

const { args, _d, _p } = require("../core");
const ejsbuild = require("../src/build");
const ejsbuild_dev = require("../src/build-dev");
const command = args[0];

(async function () {
  switch (command) {
    case "dev":
      ejsbuild_dev();
      break;
    case "build":
      ejsbuild();
      break;

    default:
      _d(`\x1b[31mCommmand '${command}' not found.`);
      break;
  }
})();
