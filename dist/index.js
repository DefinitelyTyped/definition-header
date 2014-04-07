/// <reference path="./../ownTypings/parsimmon.d.ts" />
/// <reference path="./../typings/xregexp/xregexp.d.ts" />
'use strict';
var P = require('parsimmon');
var X = require('xregexp');
var XRegExp = X.XRegExp;

exports.REPOSITORY = 'https://github.com/borisyankov/DefinitelyTyped';

var Assertions;
(function (Assertions) {
    'use strict';

    function ok(truth, message) {
        if (!truth) {
            throw new Error(message || '<no message>');
        }
    }
    Assertions.ok = ok;
    function number(truth, message) {
        ok(typeof truth === 'string' && !isNaN(truth), 'expected number' + (message ? ': ' + message : ''));
    }
    Assertions.number = number;
    function string(truth, message) {
        ok(typeof truth === 'string', 'expected string' + (message ? ': ' + message : ''));
    }
    Assertions.string = string;
    function object(truth, message) {
        ok(typeof truth === 'object' && truth, 'expected object' + (message ? ': ' + message : ''));
    }
    Assertions.object = object;
    function array(truth, message) {
        ok(Array.isArray(truth), 'expected array' + (message ? ': ' + message : ''));
    }
    Assertions.array = array;
})(Assertions || (Assertions = {}));

var Parsers;
(function (Parsers) {
    'use strict';

    /* tslint:disable:max-line-length:*/
    var id = P.regex(/[a-z]\w*/i);
    var semver = P.regex(/v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)/, 1);
    var space = P.string(' ');
    var colon = P.string(':');
    var optColon = P.regex(/:?/);
    var line = P.regex(/\r?\n/);

    // https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
    var uriLib = P.regex(/((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i);
    var uriBracket = P.string('<').then(uriLib).skip(P.string('>'));

    var bomOpt = P.regex(/\uFEFF?/);

    var comment = P.string('//');

    // global unity by unicode
    var nameUTF = P.regex(XRegExp('\\p{L}+(?:[ -]\\p{L}+)*'));

    Parsers.author = nameUTF.skip(space).then(function (n) {
        return uriBracket.or(P.succeed(null)).map(function (u) {
            var ret = {
                name: n,
                url: u
            };
            return ret;
        });
    });

    var authorSeparator = P.string(',').then(P.string(' ').or(P.regex(/\r?\n\/\/[ \t]*/, 0)));

    /* tslint:enable:max-line-length:*/
    Parsers.label = comment.then(space).then(P.string('Type definitions for')).then(optColon).then(space).then(id).then(function (n) {
        return space.then(semver).or(P.succeed(null)).map(function (v) {
            var ret = {
                name: n,
                version: v
            };
            return ret;
        });
    });

    Parsers.project = comment.then(space).then(P.string('Project')).then(colon).then(space).then(uriLib).map(function (u) {
        var ret = {
            url: u
        };
        return ret;
    });

    Parsers.authors = comment.then(space).then(P.string('Definitions by')).then(colon).then(space).then(Parsers.author).then(function (a) {
        return authorSeparator.then(Parsers.author).many().or(P.succeed([])).map(function (arr) {
            arr.unshift(a);
            return arr;
        });
    });

    Parsers.repo = comment.then(space).then(P.string('Definitions')).then(colon).then(space).then(uriLib).map(function (u) {
        var ret = {
            url: u
        };
        return ret;
    });

    Parsers.header = bomOpt.then(P.seq(Parsers.label.skip(line), Parsers.project.skip(line), Parsers.authors.skip(line), Parsers.repo.skip(line))).map(function (arr) {
        var ret = {
            label: arr[0],
            project: arr[1],
            authors: arr[2],
            repository: arr[3]
        };
        return ret;
    }).skip(P.all);
})(Parsers || (Parsers = {}));

function parse(source) {
    'use strict';

    var header = Parsers.header.parse(source);
    exports.assert(header);
    return header;
}
exports.parse = parse;

function serialise(header) {
    'use strict';

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

// should be a json-schema?
function assert(header) {
    'use strict';

    Assertions.object(header, 'header');

    Assertions.object(header.label, 'header.label');
    Assertions.string(header.label.name, 'header.label.name');
    if (header.label.version) {
        Assertions.string(header.label.version, 'header.label.url');
    }
    Assertions.object(header.project, 'header.project');
    Assertions.string(header.project.url, 'header.project.url');

    Assertions.object(header.repository, 'header.repository');
    Assertions.string(header.repository.url, 'header.repository.url');

    Assertions.array(header.authors, 'header.authors');
    Assertions.ok(header.authors.length > 0, 'header.authors.length > 0');

    header.authors.forEach(function (author, i) {
        Assertions.string(author.name, 'author[' + i + '].name');
        Assertions.string(author.url, 'author[' + i + '].url');
    });

    return null;
}
exports.assert = assert;

// need json-schema (try using typson on interfaces)
function analise(header) {
    'use strict';

    return null;
}
exports.analise = analise;

function fromPackage(pkg) {
    'use strict';

    Assertions.object(pkg, 'pkg');
    Assertions.string(pkg.name, 'pkg.version');
    Assertions.string(pkg.version, 'pkg.version');
    Assertions.string(pkg.homepage, 'pkg.homepage');

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
                auth = Parsers.author.parse(auth);
            }
            Assertions.object(auth, auth);
            Assertions.string(auth.name, 'auth.name');
            Assertions.string(auth.url, 'auth.url');
            return auth;
        })
    };
    exports.assert(header);
    return header;
}
exports.fromPackage = fromPackage;
//# sourceMappingURL=index.js.map
