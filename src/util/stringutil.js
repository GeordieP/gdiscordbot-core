'use strict'
const Path = require('path')

module.exports.stripAllWhitespace = function(text) {
    // remove any number of spaces
    return text.replace(/\s*/g, '')
}

module.exports.stripLeadingTrailingWhitespace = function(text) {
    // remove any number of leading or trailing spaces
    return text.replace(/^\s*|\s*$/g, '')
}

module.exports.stripInvalidPathCharacters = function(text) {
    // remove invalid characters: < > " | \b \0 \t * ? 
    return text.replace(/["<>|\b\0\t*?]/g, '')
}

module.exports.normalizePathSeparators = function(text) {
    // replace sequences of backslashes with a forward slash
    // handles double escapes (\\\\)
    return text.replace(/\\+/g, '/')
}

module.exports.sanitizePath = function(path) {
    let newpath = module.exports.stripInvalidPathCharacters(path)
    newpath = module.exports.stripLeadingTrailingWhitespace(newpath)
    return module.exports.normalizePathSeparators(newpath)
    return newpath
}

module.exports.relativePathToAbsolute = function(path, baseDir) {
    // if path appears to be relative, and a valid base dir was given
    if (/^\.\//.test(path) && baseDir) path  = Path.join(baseDir, path)
    return path
}
