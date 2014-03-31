/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import P = require('parsimmon');
import X = require('xregexp');
import XRegExp = X.XRegExp;

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

module parsers {
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

	var authorElem = nameUTF.skip(space).then((n) => {
		return uriBracket.or(P.succeed(null)).map((u) => {
			var ret: Author = {
				name: n,
				url: u
			};
			return ret;
		});
	});

	var authorSeperator = P.string(', ');

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
		.then(authorElem).then((a) => {
			return authorSeperator.then(authorElem).many().or(P.succeed([])).map((arr) => {
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
	return parsers.header.parse(source);
}

export function serialise(header: Header): string[] {
	var ret: string[] = [];
	ret.push('// Type definitions for ' + header.label.name + (header.label.version ? ' ' + header.label.version : ''));
	ret.push('// Project: ' + header.project.url);
	ret.push('// Definitions by: ' + header.authors.map((author) => {
		return author.name + (author.url ? ' <' + author.url + '>' : '');
	}).join(', '));
	ret.push('// Definitions: ' + header.repository.url);
	return ret;
}
