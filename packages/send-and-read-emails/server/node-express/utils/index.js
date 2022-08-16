// Utility function for pretty-printing JSONs :)
function prettyPrintJSON(json) {
  return JSON.stringify(json, undefined, 2);
}

module.exports = { prettyPrintJSON };
