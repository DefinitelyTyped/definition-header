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
var tabSpace = P.regex(/[ \t]/).desc('tab or space');
var optTabSpace = P.regex(/[ \t]*/).desc('tab or space');
var optComma = P.regex(/,?/);

var url = P.regex(regex.uri).desc('url');
var urlBracket = P.string('<').then(url).skip(P.string('>'));

var bomOpt = P.regex(regex.bomOpt);

var comment = P.string('//');
var commentSpace = comment.skip(space);
var commentTab = comment.skip(tabSpace);
var comment3 = P.string('///').skip(space);

var nameUTF = P.regex(regex.nameUTF).desc('name');

var separatorComma = P.string(',')
	.then(space.or(optTabSpace
		.then(linebreak)
		.then(comment)
		.then(tabSpace)
		.then(optTabSpace)
	)
);

var separatorOptComma = P.seq(P.string(','), space)
	.or(optTabSpace
		.then(optComma)
		.then(linebreak)
		.then(comment)
		.then(tabSpace)
		.then(optTabSpace)
);

export var person: P.Parser<model.Person> = P.seq(
	nameUTF,
	P.alt(
		space.then(urlBracket),
		P.succeed(null)
	))
	.map((arr) => {
		return {
			name: arr[0],
			url: arr[1] ? utils.untrail(arr[1]) : null
		};
	})
	.skip(optTabSpace);

export var label: P.Parser<model.Label> = commentSpace
	.then(P.string('Type definitions for'))
	.then(space)
	.then(id)
	.map((str: string) => {
		regex.semverExtract.lastIndex = 0;
		var extr = regex.semverExtract.exec(str);
		return {
			name: extr ? extr[1] : str,
			version: extr && extr[2] ? extr[2] : null
		};
	})
	.skip(optTabSpace);

export var project: P.Parser<model.Project[]> = commentSpace
	.then(P.string('Project:'))
	.then(space)
	.then(P.seq(
		url,
		separatorOptComma.then(url).many()
	))
	.map((arr: any) => {
		var ret = [];
		ret.push({
			url: utils.untrail(arr[0])
		});
		arr[1].forEach((url: string) => {
			ret.push({
				url: utils.untrail(url)
			});
		});
		return ret;
	})
	.skip(optTabSpace);

export var authors: P.Parser<model.Author[]> = commentSpace
	.then(P.string('Definitions by:'))
	.then(space)
	.then(P.seq(
		person,
		separatorComma.then(person).many()
	))
	.map((arr) => {
		var ret = <model.Author[]> arr[1];
		ret.unshift(<model.Author> arr[0]);
		return ret;
	})
	.skip(optTabSpace);

export var repo: P.Parser<model.Repository> = commentSpace
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
			project: <model.Project[]> arr[1],
			authors: <model.Author[]> arr[2],
			repository: <model.Repository> arr[3]
		};
	});
