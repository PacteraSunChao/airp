/**
 * Shared JSON preference storage for HTML client scripts.
 * Prefer localStorage; fall back to an in-memory Map when unavailable.
 */
export function buildClientStorageScript(): string {
  return `(function () {
  var memory = Object.create(null);

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) {
        if (Object.prototype.hasOwnProperty.call(memory, key)) {
          return memory[key];
        }
        return fallback;
      }
      var parsed = JSON.parse(raw);
      memory[key] = parsed;
      return parsed;
    } catch (error) {
      if (Object.prototype.hasOwnProperty.call(memory, key)) {
        return memory[key];
      }
      return fallback;
    }
  }

  function writeJson(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // file://, quota, or privacy mode — memory already updated.
    }
  }

  function remove(key) {
    delete memory[key];
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // file:// or privacy mode — memory already cleared.
    }
  }

  window.__airpStorage = {
    readJson: readJson,
    writeJson: writeJson,
    remove: remove,
  };
})();`;
}
