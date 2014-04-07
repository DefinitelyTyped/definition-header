/// <reference path="./../ownTypings/parsimmon.d.ts" />
/// <reference path="./../typings/xregexp/xregexp.d.ts" />

'use strict';

import P = require('parsimmon');
import X = require('xregexp');
import XRegExp = X.XRegExp;

export var REPOSITORY = 'https://github.com/borisyankov/DefinitelyTyped';

export interface IHeader {
	label: ILabel;
	project: IProject;
	authors: IAuthor[];
	repository: IRepository;
}

export interface ILabel {
	name: string;
	version: string;
}

export interface IProject {
	url: string;
}

export interface IAuthor {
	name: string;
	url: string;
}

export interface IRepository {
	url: string;
}

module Assertions {
	'use strict';

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

module Parsers {
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

	export var author = nameUTF.skip(space).then((n) => {
		return uriBracket.or(P.succeed(null)).map((u) => {
			var ret: IAuthor = {
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
				var ret: ILabel = {
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
			var ret: IProject = {
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
			var ret: IRepository = {
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
			var ret: IHeader = {
				label: arr[0],
				project: arr[1],
				authors: arr[2],
				repository: arr[3]
			};
			return ret;
		})
		.skip(P.all);
}

export function parse(source: string): IHeader {
	'use strict';

	var header = Parsers.header.parse(source);
	assert(header);
	return header;
}

export function serialise(header: IHeader): string[] {
	'use strict';

	assert(header);

	var ret: string[] = [];
	ret.push('// Type definitions for ' + header.label.name + (header.label.version ? ' ' + header.label.version : ''));
	ret.push('// Project: ' + header.project.url);
	ret.push('// Definitions by: ' + header.authors.map(author => author.name + (author.url ? ' <' + author.url + '>' : '')).join(', '));
	ret.push('// Definitions: ' + header.repository.url);
	return ret;
}

// should be a json-schema?
export function assert(header: IHeader): any {
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

	header.authors.forEach((author, i) => {
		Assertions.string(author.name, 'author[' + i + '].name');
		Assertions.string(author.url, 'author[' + i + '].url');
	});

	return null;
}

// need json-schema (try using typson on interfaces)
export function analise(header: IHeader): any {
	'use strict';

	return null;
}

export function fromPackage(pkg: any): IHeader {
	'use strict';

	Assertions.object(pkg, 'pkg');
	Assertions.string(pkg.name, 'pkg.version');
	Assertions.string(pkg.version, 'pkg.version');
	Assertions.string(pkg.homepage, 'pkg.homepage');

	var header: IHeader = {
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
				auth = Parsers.author.parse(auth);
			}
			Assertions.object(auth, auth);
			Assertions.string(auth.name, 'auth.name');
			Assertions.string(auth.url, 'auth.url');
			return auth;
		})
	};
	assert(header);
	return header;
}
