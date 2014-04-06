/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import P = require('parsimmon');
import X = require('xregexp');
import XRegExp = X.XRegExp;

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
}

module parsers {
	/* tslint:disable:max-line-length:*/
	var id = P.regex(/[a-z]\w*/i);
	var semver = P.regex(/v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)/, 1);
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

	export var author = nameUTF.skip(space).then((n) => {
		return uriBracket.or(P.succeed(null)).map((u) => {
			var ret: Author = {
				name: n,
				url: u
			};
			return ret;
		});
	});

	var authorSeparator = P.string(',').then(P.string(' ').or(P.regex(/\r?\n\/\/[ \t]*/, 0)));

	/* tslint:enable:max-line-length:*/

	export var label = comment
		.then(space)
		.then(P.string('Type definitions for')).then(optColon).then(space)
		.then(id)
		.then((n) => {
			return space.then(semver).or(P.succeed(null)).map((v) => {
				var ret: Label = {
					name: n,
					version: v
				};
				return ret;
			});
		});

	export var project = comment
		.then(space)
		.then(P.string('Project')).then(colon).then(space)
		.then(uriLib).map((u) => {
			var ret: Project = {
				url: u
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
		.then(uriLib).map((u) => {
			var ret: Repository = {
				url: u
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

// should be a json-schema?
export function assert(header: Header): any {
	assertions.object(header, 'header');

	assertions.object(header.label, 'header.label');
	assertions.string(header.label.name, 'header.label.name');
	if (header.label.version) {
		assertions.string(header.label.version, 'header.label.url');
	}
	assertions.object(header.project, 'header.project');
	assertions.string(header.project.url, 'header.project.url');

	assertions.object(header.repository, 'header.repository');
	assertions.string(header.repository.url, 'header.repository.url');

	assertions.array(header.authors, 'header.authors');
	assertions.ok(header.authors.length > 0, 'header.authors.length > 0');

	header.authors.forEach((author, i) => {
		assertions.string(author.name, 'author[' + i + '].name');
		assertions.string(author.url, 'author[' + i + '].url');
	});

	return null;
}

// need json-schema (try using typson on interfaces)
export function analise(header: Header): any {
	return null;
}

export function fromPackage(pkg: any): Header {
	assertions.object(pkg, 'pkg');
	assertions.string(pkg.name, 'pkg.version');
	assertions.string(pkg.version, 'pkg.version');
	assertions.string(pkg.homepage, 'pkg.homepage');

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
		authors: (pkg.autors || pkg.author ? [pkg.author] : []).map(function(auth) {
			if (typeof auth === 'string') {
				auth = parsers.author.parse(auth);
			}
			assertions.object(auth, auth);
			assertions.string(auth.name, 'auth.name');
			assertions.string(auth.url, 'auth.url');
			return auth;
		})
	};
	assert(header);
	return header;
}
