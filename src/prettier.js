const prettier = require("prettier");

function formatHtml(html) {
  return prettier.format(html, {
    parser: "html",
    bracketSameLine: true,
    singleAttributePerLine: false,
    printWidth: 180,
  });
}

module.exports = formatHtml;
