/* eslint-disable no-console */
const chalk = require("chalk");

const logger = {
  info: (...args) => console.log(chalk.cyan(...args)),
  debug: (...args) => console.log(chalk.yellow(...args)),
  error: (...args) => console.log(chalk.red(...args))
};

module.exports = logger;
