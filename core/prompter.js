const inquirer = require("@inquirer/prompts");

class Prompter {
  static async $confirm(message, defaultValue) {
    try {
      const p = await inquirer.confirm(
        {
          message: message,
          default: defaultValue,
        },
        {
          clearPromptOnDone: true,
        },
      );

      return p;
    } catch (_) {}
  }
  static async $input(message, defaultValue = "") {
    try {
      const p = await inquirer.input(
        {
          message,
          default: defaultValue,
        },
        {
          clearPromptOnDone: true,
        },
      );

      return p;
    } catch (_) {}
  }

  static async $password(message) {
    try {
      const p = await inquirer.password(
        {
          message,
          mask: "*",
        },
        {
          clearPromptOnDone: true,
        },
      );

      return p;
    } catch (_) {}
  }
  static async $select(message, choices, defaultValue) {
    try {
      const p = await inquirer.select(
        {
          message,
          choices: choices,
          default: defaultValue,
        },
        {
          // clearPromptOnDone: true,
        },
      );

      return p;
    } catch (_) {}
  }
  static async $checkbox(message, choices) {
    try {
      const p = await inquirer.checkbox(
        {
          message,
          choices,
        },
        {
          clearPromptOnDone: true,
        },
      );

      return p;
    } catch (_) {}
  }

  static async $number(message, defaultValue = 0) {
    try {
      const p = await inquirer.number(
        {
          message,
          default: defaultValue,
        },
        {
          clearPromptOnDone: true,
        },
      );

      return p;
    } catch (_) {}
  }
}

module.exports = Prompter;
