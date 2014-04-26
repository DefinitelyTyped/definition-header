/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import P = require('parsimmon');

import model = require('./model');
import regex = require('./regex');
import utils = require('./utils');

var id = P.regex(regex.label);
var space = P.string(' ');
var colon = P.string(':');
var optColon = P.regex(/:?/);
var line = P.regex(/\r?\n/);

var uri = P.regex(regex.uri);
var uriBracket = P.string('<').then(uri).skip(P.string('>'));

var bomOpt = P.regex(regex.bomOpt);

var comment = P.string('//');
var comment3 = P.string('///');

var nameUTF = P.regex(regex.nameUTF);

var personSeparator = P.string(',').then(P.regex(/ ?\r?\n\/\/[ \t]*/).or(P.string(' ')));

export var person = nameUTF.then((n) => {
	return space.then(uriBracket).or(P.succeed(null)).map((u) => {
		var ret: model.Author = {
			name: n,
			url: u ? utils.untrail(u) : u
		};
		return ret;
	});
});

export var label = comment
	.then(space)
	.then(P.string('Type definitions for')).then(optColon).then(space)
	.then(id).map((nn) => {
		// TODO move semver extractor to sub-parser
		regex.semverExtract.lastIndex = 0;
		var extr = regex.semverExtract.exec(nn);
		var ret: model.Label = extr ? {
			name: extr[1],
			version: extr[2] || null
		} : {
			name: nn,
			version: null
		};
		return ret;
	});

export var project = comment
	.then(space)
	.then(P.string('Project')).then(colon).then(space)
	.then(uri).map((u) => {
		var ret: model.Project = {
			url: utils.untrail(u)
		};
		return ret;
	});

export var authors = comment
	.then(space)
	.then(P.string('Definitions by')).then(colon).then(space)
	.then(person).then((a) => {
		return personSeparator.then(person).many().or(P.succeed([])).map((arr) => {
			arr.unshift(a);
			return arr;
		});
	});

export var repo = comment
	.then(space)
	.then(P.string('Definitions')).then(colon).then(space)
	.then(uri).map((u) => {
		var ret: model.Repository = {
			url: utils.untrail(u)
		};
		return ret;
	});

export var header = bomOpt
	.then(P.seq(
		label.skip(line),
		project.skip(line),
		authors.skip(line),
		repo.skip(line)
	))
	.map((arr: any[]) => {
		var ret: model.Header = {
			label: arr[0],
			project: arr[1],
			authors: arr[2],
			repository: arr[3]
		};
		return ret;
	})
	.skip(P.all);
