/// <reference path="./tsd.d.ts" />

import util = require('util');
import path = require('path');
import fs = require('fs');
import P = require('parsimmon');
import Promise = require('bluebird');

import XRegExpMod = require('xregexp');
import XRegExp = XRegExpMod.XRegExp

var sms = require('source-map-support');
sms.install();

function getFixture(name) {
	return fs.readFileSync('./test/fixtures/' + name + '.d.ts').toString('utf8');
}

function runParse(label, parser, text) {
	console.log('---');
	console.log(label);
	if (typeof text !== 'string') {
		throw new Error('bad text: ' + text);
	}
	try {
		var res = parser.parse(text);
		console.log(res);
	}
	catch (e) {
		printError(e);
	}
}

function printError(err) {
	console.log(typeof err);
	console.log(util.inspect(err, true, 2));
}

// whut? silly node def
var raw = {
	basic: getFixture('basic'),
	project: getFixture('project'),
	label: getFixture('label'),
	repo: getFixture('repo'),
	author: getFixture('author')
};
console.log(raw);

var id = P.regex(/[a-z]\w*/i);
var semver = P.regex(/\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?/);
var anyChar = P.regex(/[\S]+/);
var anyStr = P.regex(/[\S\s]+/);
var chars = P.regex(/\S+/);
var space = P.string(' ');
var optLabel = P.regex(/:?/);
var line = P.regex(/\r?\n/);
var lineT = P.regex(/ *\r?\n/);

// https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
var uriLib = P.regex(/((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i);
var uriBracket = P.string('<').then(uriLib).skip(P.string('>'));

var bom = P.regex(/\uFEFF/);
var bomOpt = P.regex(/\uFEFF?/);

var comment = P.string('//');
var comment3 = P.string('///');

var label = comment
	.skip(space)
	.skip(P.string('Type definitions for')).skip(optLabel).skip(space)
	.then(id)
	.then((name) => {
		return space.then(semver).or(P.succeed(null)).map((semver) => {
			return {
				name: name,
				semver: semver
			};
		});
	})
	.skip(lineT);

var project = comment
	.then(space)
	.then(P.string('Project')).skip(optLabel).skip(space)
	.then(uriLib).map((url) => {
		return {url: url};
	})
	.skip(lineT);

// global unity by unicode
var nameUTF = P.regex(XRegExp('\\p{L}+(?:[ -]\\p{L}+)*'));

var authorElem = nameUTF.skip(space).then((name) => {
	return uriBracket.or(P.succeed(null)).map((url) => {
		return {
			name: name,
			url: url
		};
	});
});

var author = comment
	.then(space)
	.then(P.string('Definitions by')).skip(optLabel).skip(space)
	.then(authorElem)
	.skip(lineT);

var header = bomOpt
	.then(label)
	.map((label) => {
		return project.map((project) => {
			return {
				label: label,
				project: project
			};
		});
	});

Promise.try(() => {
	runParse('label', label, raw.label)
}).then(() => {
	runParse('project', project, raw.project)
}).then(() => {
	runParse('author', author, raw.author)
}).then(() => {
	runParse('basic', header, raw.basic)
}).catch((e) => {
	console.log('---');
	console.log('done!');
	printError(e);
});


