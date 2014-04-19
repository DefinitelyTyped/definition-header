/// <reference path="./../typings/tsd.d.ts" />
'use strict';
var path = require('path');

var P = require('parsimmon');
var X = require('xregexp');
var XRegExp = X.XRegExp;
var Joi = require('joi');

exports.REPOSITORY = 'https://github.com/borisyankov/DefinitelyTyped';

var regex;
(function (regex) {
    /* tslint:disable:max-line-length:*/
    // export var label = /[a-z](?:[ _\.-]?[a-z0-9]+)*/i;
    // TODO kill parenthesis
    regex.label = /[a-z](?:(?:[ _\.-]| [\/@-] )?\(?[a-z0-9]+\)?)*/i;

    regex.semverC = /\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?/;
    regex.semverV = /v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)/;
    regex.semverExtract = /^(.*?)[ -]v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)$/;

    // https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
    regex.uri = /((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;

    // global unity by unicode
    regex.name = /[a-z]+(?:(?:\. |[ _\.-]| [\/@-] )?[a-z0-9]+)*/i;
    regex.nameUTF = XRegExp('\\p{L}+(?:(?:\\. |[ _\\.-]| [\\/@-] )?\\p{L}+)*');
})(regex || (regex = {}));

var assertions;
(function (assertions) {
    function ok(truth, message) {
        if (!truth) {
            throw new Error(message || '<no message>');
        }
    }
    assertions.ok = ok;

    function number(truth, message) {
        ok(typeof truth === 'string' && !isNaN(truth), 'expected number' + (message ? ': ' + message : ''));
    }
    assertions.number = number;

    function string(truth, message) {
        ok(typeof truth === 'string', 'expected string' + (message ? ': ' + message : ''));
    }
    assertions.string = string;

    function object(truth, message) {
        ok(typeof truth === 'object' && truth, 'expected object' + (message ? ': ' + message : ''));
    }
    assertions.object = object;

    function array(truth, message) {
        ok(Array.isArray(truth), 'expected array' + (message ? ': ' + message : ''));
    }
    assertions.array = array;

    function uri(truth, message) {
        ok(regex.uri.test(truth), 'expected uri' + (message ? ': ' + message : ''));
    }
    assertions.uri = uri;

    function semver(truth, message) {
        ok(regex.semverC.test(truth), 'expected uri' + (message ? ': ' + message : ''));
    }
    assertions.semver = semver;
})(assertions || (assertions = {}));

var headerSchema = Joi.object({
    label: Joi.object({
        name: Joi.string().regex(regex.nameUTF).required(),
        version: Joi.string().regex(regex.semverC).optional()
    }).required(),
    project: Joi.object({
        url: Joi.string().regex(regex.uri).required()
    }).required(),
    repository: Joi.object({
        url: Joi.string().regex(regex.uri).required()
    }).required(),
    authors: Joi.array().min(1).includes(Joi.object({
        name: Joi.string().regex(regex.nameUTF).required(),
        url: Joi.string().regex(regex.uri).optional()
    })).required()
});

var parsers;
(function (parsers) {
    var id = P.regex(regex.label);
    var space = P.string(' ');
    var colon = P.string(':');
    var optColon = P.regex(/:?/);
    var line = P.regex(/\r?\n/);

    var uri = P.regex(regex.uri);
    var uriBracket = P.string('<').then(uri).skip(P.string('>'));

    var bomOpt = P.regex(/\uFEFF?/);

    var comment = P.string('//');
    var comment3 = P.string('///');

    var nameUTF = P.regex(regex.nameUTF);

    parsers.author = nameUTF.then(function (n) {
        return space.then(uriBracket).or(P.succeed(null)).map(function (u) {
            var ret = {
                name: n,
                url: untrail(u)
            };
            return ret;
        });
    });

    var authorSeparator = P.string(',').then(P.regex(/ ?\r?\n\/\/[ \t]*/).or(P.string(' ')));

    parsers.label = comment.then(space).then(P.string('Type definitions for')).then(optColon).then(space).then(id).map(function (nn) {
        // TODO move semver extractor to sub-parser
        regex.semverExtract.lastIndex = 0;
        var extr = regex.semverExtract.exec(nn);
        var ret = extr ? {
            name: extr[1],
            version: extr[2] || null
        } : {
            name: nn,
            version: null
        };
        return ret;
    });

    parsers.project = comment.then(space).then(P.string('Project')).then(colon).then(space).then(uri).map(function (u) {
        var ret = {
            url: untrail(u)
        };
        return ret;
    });

    parsers.authors = comment.then(space).then(P.string('Definitions by')).then(colon).then(space).then(parsers.author).then(function (a) {
        return authorSeparator.then(parsers.author).many().or(P.succeed([])).map(function (arr) {
            arr.unshift(a);
            return arr;
        });
    });

    parsers.repo = comment.then(space).then(P.string('Definitions')).then(colon).then(space).then(uri).map(function (u) {
        var ret = {
            url: untrail(u)
        };
        return ret;
    });

    parsers.header = bomOpt.then(P.seq(parsers.label.skip(line), parsers.project.skip(line), parsers.authors.skip(line), parsers.repo.skip(line))).map(function (arr) {
        var ret = {
            label: arr[0],
            project: arr[1],
            authors: arr[2],
            repository: arr[3]
        };
        return ret;
    }).skip(P.all);
})(parsers || (parsers = {}));

function parse(source) {
    var header = parsers.header.parse(source);
    exports.assert(header);
    return header;
}
exports.parse = parse;

function serialise(header) {
    exports.assert(header);

    var ret = [];
    ret.push('// Type definitions for ' + header.label.name + (header.label.version ? ' ' + header.label.version : ''));
    ret.push('// Project: ' + header.project.url);
    ret.push('// Definitions by: ' + header.authors.map(function (author) {
        return author.name + (author.url ? ' <' + author.url + '>' : '');
    }).join(', '));
    ret.push('// Definitions: ' + header.repository.url);
    return ret;
}
exports.serialise = serialise;

function assert(header) {
    headerSchema.validate(header, null, function (err) {
        if (err) {
            console.log('Header assert error');
            console.log(err);

            throw err;
        }
    });
}
exports.assert = assert;

var lineExp = /\r?\n/g;

function getLines(stream, start, end) {
    if (typeof end === "undefined") { end = 0; }
    // TODO improve line grabber (remove horrible split for top-down line parser)
    var arr = stream.split(lineExp);
    start = Math.max(start, 0);
    if (!end) {
        end = arr.length - 1;
    } else {
        end = Math.min(end, arr.length - 1);
    }
    end = Math.max(end, start + 1);
    return arr.slice(start, end + 1);
}

function untrail(str) {
    if (!str) {
        return str;
    }
    return str.replace(/\/$/, '');
}

function pointer(col) {
    var str = '';
    for (var i = 0; i < col - 1; i++) {
        str += '-';
    }
    return str + '^';
}

function highlightPos(stream, row, col) {
    var lines = getLines(stream, 0, row + 2);
    if (typeof col === 'number') {
        lines.splice(row + 1, 0, pointer(col));
    }
    return lines.join('\n');
}
exports.highlightPos = highlightPos;

function linkPos(dest, row, col, add) {
    if (typeof add === "undefined") { add = false; }
    if (typeof col !== 'number') {
        col = 0;
    }
    if (typeof row !== 'number') {
        row = 0;
    }
    if (add) {
        col += 1;
        row += 1;
    }
    return path.resolve(path.normalize(dest)) + '[' + row + ',' + col + ']';
}
exports.linkPos = linkPos;

function fromPackage(pkg) {
    assertions.object(pkg, 'pkg');

    // naively set values
    var header = {
        label: {
            name: pkg.name,
            version: pkg.version
        },
        project: {
            url: pkg.homepage
        },
        repository: {
            url: exports.REPOSITORY
        },
        authors: (pkg.autors || pkg.author ? [pkg.author] : []).map(function (auth) {
            if (typeof auth === 'string') {
                auth = parsers.author.parse(auth);
            }
            return auth;
        })
    };

    // do shared deep assertion
    exports.assert(header);
    return header;
}
exports.fromPackage = fromPackage;
//# sourceMappingURL=index.js.map
