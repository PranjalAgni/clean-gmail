const LineReader = require("n-readlines");

const getFilterList = (filePath) => {
  const filterList = [];
  const lineReader = new LineReader(filePath);
  let line = lineReader.next();
  while (line) {
    filterList.push(line.toString("utf-8"));
    line = lineReader.next();
  }
  return filterList;
};

module.exports = {
  getFilterList
};
