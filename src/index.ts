/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import path = require('path');

import P = require('parsimmon');
import X = require('xregexp');
import XRegExp = X.XRegExp;
import Joi = require('joi');

export var REPOSITORY = 'https://github.com/borisyankov/DefinitelyTyped';

export interface Header {
	label: Label;
	project: Project;
	authors: Author[];
	repository: Repository;
}

export interface Label {
	name: string;
	version: string;
}

export interface Project {
	url: string;
}

export interface Author {
	name: string;
	url: string;
}

export interface Repository {
	url: string;
}

module regex {
	/* tslint:disable:max-line-length:*/

	// export var label = /[a-z](?:[ _\.-]?[a-z0-9]+)*/i;
	// TODO kill parenthesis
	export var label = /[a-z](?:(?:[ _\.-]| [\/@-] )?\(?[a-z0-9]+\)?)*/i;

	export var semverC = /\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?/;
	export var semverV = /v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)/;
	export var semverExtract = /^(.*?)[ -]v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)$/;

	// https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
	export var uri = /((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;
	// global unity by unicode
	export var name = /[a-z]+(?:(?:\. |[ _\.-]| [\/@-] )?[a-z0-9]+)*/i;
	export var nameUTF = XRegExp('\\p{L}+(?:(?:\\. |[ _\\.-]| [\\/@-] )?\\p{L}+)*');
	// export var nameUTF = XRegExp('\\p{L}+(?:[ \\.@-]\\p{L}+)*');

	/* tslint:enable:max-line-length:*/
}

module assertions {
	export function ok(truth: any, message?: string) {
		if (!truth) {
			throw new Error(message || '<no message>');
		}
	}

	export function number(truth: any, message?: string): void {
		ok(typeof truth === 'string' && !isNaN(truth), 'expected number' + (message ? ': ' + message : ''));
	}

	export function string(truth: any, message?: string): void {
		ok(typeof truth === 'string', 'expected string' + (message ? ': ' + message : ''));
	}

	export function object(truth: any, message?: string): void {
		ok(typeof truth === 'object' && truth, 'expected object' + (message ? ': ' + message : ''));
	}

	export function array(truth: any, message?: string): void {
		ok(Array.isArray(truth), 'expected array' + (message ? ': ' + message : ''));
	}

	export function uri(truth: any, message?: string): void {
		ok(regex.uri.test(truth), 'expected uri' + (message ? ': ' + message : ''));
	}

	export function semver(truth: any, message?: string): void {
		ok(regex.semverC.test(truth), 'expected uri' + (message ? ': ' + message : ''));
	}
}

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

module parsers {
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

	export var author = nameUTF.then((n) => {
		return space.then(uriBracket).or(P.succeed(null)).map((u) => {
			var ret: Author = {
				name: n,
				url: untrail(u)
			};
			return ret;
		});
	});

	var authorSeparator = P.string(',').then(P.regex(/ ?\r?\n\/\/[ \t]*/).or(P.string(' ')));

	export var label = comment
		.then(space)
		.then(P.string('Type definitions for')).then(optColon).then(space)
		.then(id).map((nn) => {
			// TODO move semver extractor to sub-parser
			regex.semverExtract.lastIndex = 0;
			var extr = regex.semverExtract.exec(nn);
			var ret: Label = extr ? {
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
			var ret: Project = {
				url: untrail(u)
			};
			return ret;
		});

	export var authors = comment
		.then(space)
		.then(P.string('Definitions by')).then(colon).then(space)
		.then(author).then((a) => {
			return authorSeparator.then(author).many().or(P.succeed([])).map((arr) => {
				arr.unshift(a);
				return arr;
			});
		});

	export var repo = comment
		.then(space)
		.then(P.string('Definitions')).then(colon).then(space)
		.then(uri).map((u) => {
			var ret: Repository = {
				url: untrail(u)
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
			var ret: Header = {
				label: arr[0],
				project: arr[1],
				authors: arr[2],
				repository: arr[3]
			};
			return ret;
		})
		.skip(P.all);
}

export function parse(source: string): Header {
	var header = parsers.header.parse(source);
	assert(header);
	return header;
}

export function serialise(header: Header): string[] {
	assert(header);

	var ret: string[] = [];
	ret.push('// Type definitions for ' + header.label.name + (header.label.version ? ' ' + header.label.version : ''));
	ret.push('// Project: ' + header.project.url);
	ret.push('// Definitions by: ' + header.authors.map((author) => {
		return author.name + (author.url ? ' <' + author.url + '>' : '');
	}).join(', '));
	ret.push('// Definitions: ' + header.repository.url);
	return ret;
}

export function assert(header: Header): void {
	headerSchema.validate(header, null, (err) => {
		if (err) {
			console.log('Header assert error');
			console.log(err);
			// TODO better report
			throw err;
		}
	});
}

var lineExp = /\r?\n/g;

function getLines(stream: string, start: number, end: number = 0): string[] {
	// TODO improve line grabber (remove horrible split for top-down line parser)
	var arr = stream.split(lineExp);
	start = Math.max(start, 0);
	if (!end) {
		end = arr.length - 1;
	}
	else {
		end = Math.min(end, arr.length - 1);
	}
	end = Math.max(end, start + 1);
	return arr.slice(start, end + 1);
}

function untrail(str: string): string {
	if (!str) {
		return str;
	}
	return str.replace(/\/$/, '');
}

function pointer(col: number): string {
	var str = '';
	for (var i = 0; i < col - 1; i++) {
		str += '-';
	}
	return str + '^';
}

export function highlightPos(stream: string, row: number, col?: number): string {
	var lines = getLines(stream, 0, row + 2);
	if (typeof col === 'number') {
		lines.splice(row + 1, 0, pointer(col));
	}
	return lines.join('\n');
}

export function linkPos(dest: string, row?: number, col?: number, add: boolean = false): string {
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

export function fromPackage(pkg: any): Header {
	assertions.object(pkg, 'pkg');

	// naively set values
	var header: Header = {
		label: {
			name: pkg.name,
			version: pkg.version
		},
		project: {
			url: pkg.homepage
		},
		repository: {
			url: REPOSITORY
		},
		authors: (pkg.autors || pkg.author ? [pkg.author] : []).map(function (auth) {
			if (typeof auth === 'string') {
				auth = parsers.author.parse(auth);
			}
			return auth;
		})
	};
	// do shared deep assertion
	assert(header);
	return header;
}
