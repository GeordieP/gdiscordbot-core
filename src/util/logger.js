'use strict'

module.exports.info = function(msg) {
    console.log("[INFO] " + msg)
}

module.exports.warn = function(msg) {
    console.warn("[WARN] " + msg)
}

module.exports.error = function(msg) {
    console.error("[ERR] " + msg)
}
