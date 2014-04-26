/// <reference path="./../typings/tsd.d.ts" />
'use strict';
var assertion = require('./assertion');
var serialise = require('./serialise');
var lax = require('./lax');

var importer = require('./importers/index');
exports.importer = importer;
var utils = require('./utils');
exports.utils = utils;

// temp for testing
var schema = require('./schema');
exports.schema = schema;

[exports.utils, exports.importer, exports.schema];

function parse(source, strict) {
    // TODO add strict parser
    var header = lax.header.parse(source);
    return header;
}
exports.parse = parse;

function stringify(header) {
    return serialise.stringify(header);
}
exports.stringify = stringify;

function assert(header) {
    return assertion.header(header);
}
exports.assert = assert;
//# sourceMappingURL=index.js.map
