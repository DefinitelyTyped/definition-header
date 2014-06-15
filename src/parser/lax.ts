/// <reference path="./../../typings/tsd.d.ts" />

'use strict';

import P = require('parsimmon');

import model = require('../model');
import regex = require('../regex');
import utils = require('../utils');


var id = P.regex(regex.label).desc('project name');
var space = P.string(' ');
var colon = P.string(':');
var optColon = P.regex(/:?/);
var linebreak = P.regex(/\r?\n/).desc('linebreak');
var lineTrail = P.regex(/[ \t]*\r?\n/).desc('linebreak');
var optTabSpace = P.regex(/[ \t]*/).desc('tab or space');

var url = P.regex(regex.uri).desc('url');
var urlBracket = P.string('<').then(url).skip(P.string('>'));

var bomOpt = P.regex(regex.bomOpt);

var comment = P.string('//').skip(space);
var comment3 = P.string('///').skip(space);

var nameUTF = P.regex(regex.nameUTF).desc('name');

var authorSeparator = P.string(',').then(
	P.regex(/ ?\r?\n\/\/[ \t]*/).desc('comment-linebreak').or(space)
);

export var person: P.Parser<model.Person> = P.seq(
	nameUTF,
	P.alt(
		space.then(urlBracket),
		P.succeed(null)
	)
)
	.map((arr) => {
		return {
			name: arr[0],
			url: arr[1] ? utils.untrail(arr[1]) : null
		};
	})
	.skip(optTabSpace);

export var label: P.Parser<model.Label> = comment
	.then(P.string('Type definitions for'))
	.then(space)
	.then(id)
	.map((str) => {
		regex.semverExtract.lastIndex = 0;
		var extr = regex.semverExtract.exec(str);
		return {
			name: extr ? extr[1] : str,
			version: extr && extr[2] ? extr[2] : null
		};
	})
	.skip(optTabSpace);

export var project: P.Parser<model.Project> = comment
	.then(P.string('Project:'))
	.then(space)
	.then(url)
	.map((url) => {
		return {
			url: utils.untrail(url)
		};
	})
	.skip(optTabSpace);

export var authors: P.Parser<model.Author[]> = comment
	.then(P.string('Definitions by:'))
	.then(space)
	.then(P.seq(
		person,
		authorSeparator.then(person).many()
	))
	.map((arr) => {
		var ret = <model.Author[]> arr[1];
		ret.unshift(<model.Author> arr[0]);
		return ret;
	})
	.skip(optTabSpace);

export var repo: P.Parser<model.Repository> = comment
	.then(P.string('Definitions:'))
	.then(space)
	.then(url)
	.map((url) => {
		return {
			url: utils.untrail(url)
		};
	})
	.skip(optTabSpace);

export var header: P.Parser<model.Header> = bomOpt
	.then(P.seq(
		label.skip(linebreak),
		project.skip(linebreak),
		authors.skip(linebreak),
		repo.skip(linebreak)
	))
	.skip(P.all)
	.map((arr) => {
		return {
			label: <model.Label> arr[0],
			project: <model.Project> arr[1],
			authors: <model.Author[]> arr[2],
			repository: <model.Repository> arr[3]
		};
	});
