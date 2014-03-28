/// <reference path="./../typings/tsd.d.ts" />
var P = require('parsimmon');
var XRegExpMod = require('xregexp');
var XRegExp = XRegExpMod.XRegExp;

'use strict';

var parsers;
(function (parsers) {
    /* tslint:disable:max-line-length:*/
    var id = P.regex(/[a-z]\w*/i);
    var semver = P.regex(/\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?/);
    var anyChar = P.regex(/[\S]+/);
    var anyStr = P.regex(/[\S\s]+/);
    var chars = P.regex(/\S+/);
    var space = P.string(' ');
    var colon = P.string(':');
    var optColon = P.regex(/:?/);
    var line = P.regex(/\r?\n/);
    var lineT = P.regex(/ *\r?\n/);

    // https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
    var uriLib = P.regex(/((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i);
    var uriBracket = P.string('<').then(uriLib).skip(P.string('>'));

    var bom = P.regex(/\uFEFF/);
    var bomOpt = P.regex(/\uFEFF?/);

    var comment = P.string('//');
    var comment3 = P.string('///');

    // global unity by unicode
    var nameUTF = P.regex(XRegExp('\\p{L}+(?:[ -]\\p{L}+)*'));

    var authorElem = nameUTF.skip(space).then(function (n) {
        return uriBracket.or(P.succeed(null)).map(function (u) {
            var ret = {
                name: n,
                url: u
            };
            return ret;
        });
    });

    var authorSeperator = P.string(', ');

    /* tslint:enable:max-line-length:*/
    parsers.label = comment.then(space).then(P.string('Type definitions for')).then(optColon).then(space).then(id).then(function (n) {
        return space.then(semver).or(P.succeed(null)).map(function (v) {
            var ret = {
                name: n,
                version: v
            };
            return ret;
        });
    });

    parsers.project = comment.then(space).then(P.string('Project')).then(colon).then(space).then(uriLib).map(function (u) {
        var ret = {
            url: u
        };
        return ret;
    });

    parsers.authors = comment.then(space).then(P.string('Definitions by')).then(colon).then(space).then(authorElem).then(function (a) {
        return authorSeperator.then(authorElem).many().or(P.succeed([])).map(function (arr) {
            arr.unshift(a);
            return arr;
        });
    });

    parsers.repo = comment.then(space).then(P.string('Definitions')).then(colon).then(space).then(uriLib).map(function (u) {
        var ret = {
            url: u
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
    return parsers.header.parse(source);
}
exports.parse = parse;

function serialise(header) {
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
//# sourceMappingURL=index.js.map
