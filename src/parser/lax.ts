'use strict';

import * as P from 'parsimmon';

import * as model from '../model';
import * as regex from '../regex';
import * as utils from '../utils';

let id = P.regex(regex.label).desc('project name');
let semver = P.regex(regex.semverV).desc('semver');
let space = P.string(' ');
let colon = P.string(':');
let optColon = P.regex(/:?/);
let linebreak = P.regex(/\r?\n/).desc('linebreak');
let lineTrail = P.regex(/[ \t]*\r?\n/).desc('linebreak');
let tabSpace = P.regex(/[ \t]/).desc('tab or space');
let optTabSpace = P.regex(/[ \t]*/).desc('tab or space');
let optComma = P.regex(/,?/);

let url = P.regex(regex.uri).desc('url');
let urlBracket = P.string('<').then(url).skip(P.string('>'));

let bomOpt = P.regex(regex.bomOpt);

let comment = P.string('//');
let commentSpace = comment.skip(space);
let commentTab = comment.skip(tabSpace);
let comment3 = P.string('///').skip(space);

let nameUTF = P.regex(regex.nameUTF).desc('name');

let separatorComma = P.string(',')
	.then(space.or(optTabSpace
		.then(linebreak)
		.then(comment)
		.then(tabSpace)
		.then(optTabSpace)
	)
);

let separatorOptComma = P.seq(P.string(','), space)
	.or(optTabSpace
		.then(optComma)
		.then(linebreak)
		.then(comment)
		.then(tabSpace)
		.then(optTabSpace)
);

let separatorProject = P.seq(P.string(','), space)
	.or(optTabSpace
		.then(optComma)
		.then(linebreak)
		.then(comment)
		.then(tabSpace)
		.then(P.seq(
			P.string('Project:'),
			tabSpace
		).or(optTabSpace))
);

let untilEndOfLine = P.takeWhile(c => {
	return c !== '\r' &&
		c !== '\n';
});

export let person: P.Parser<model.Person> = P
	.seq(
		// name: Grab everything up to the URL bracket
		P.takeWhile(c => c !== '<').skip(P.string('<')),
		// url: Grab everything between the URL brackets
		P.takeWhile(c => c !== '>').skip(P.string('>'))
	)
	.map((arr) => {
		return {
			name: arr[0].trim(),
			url: arr[1] ? utils.untrail(arr[1]) : null
		};
	})
	.skip(optTabSpace);

export let label: P.Parser<model.Label> = P
	// Starts with '// Type definitions for '
	.string('// Type definitions for ')
	// Grab the rest of the line
    .then(untilEndOfLine)
	.map((result) => {
		// Name is everything that is not the version number
		// Version number is separated from the label by a space
		// - Expected format is MAJOR.MINOR but authors might deviate from it
		// - Can be omitted
		// - Can have leading 'v'
		// - Can have trailing 'x'
		// - Can have trailing '+'
		// - Can be in the middle of the label
		// - Can indicate multiple versions (e.g. '1.10.x / 2.0.x')
		const matchVersion = /(?:[\- ])(v?[\d.x+]{2,})/ig;

		let start = result.length - 1;
		let end = 0;
		let match;
		while ((match = matchVersion.exec(result)) !== null) {
			if (match.index < start) {
				start = match.index;
			}
			end = matchVersion.lastIndex;
		}

		let name = result;
		let version: string | null = null;

		if (start < end) {
			const nameStart = result.slice(0, start).trim();
			version = result.slice(start + 1, end);
			const nameEnd = result.slice(end).trim();
			name = nameStart + ' ' + nameEnd;
		}

		return {
			name: name.trim(),
			version: version
		};
	})
	.skip(optTabSpace);

export let project: P.Parser<model.Project[]> = P.string('// Project: ')
	.then(P.seq(
		url,
		separatorProject.then(url).many()
	))
	.map((arr: any) => {
		let ret: any[] = [];
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
	.skip(untilEndOfLine);

let multilineAuthorsSeparator = P.seq(
	// Line can end with optional comma followed by any number of spaces and tabs
	optComma, optTabSpace,
	// Check if there's more authors
	linebreak.notFollowedBy(P.string('// Definitions: ')),
	// Grab the beginning of the line up to the start of the next author
	comment, optTabSpace
).map(result => result.join(''));
// Authors can be separated on the same line by a comma followed by any number of spaces and tabs
let sameLineAuthorsSeparator = P.seq(
	P.string(','), optTabSpace
).map(result => result.join(''));

export let authors: P.Parser<model.Author[]> = P.string('// Definitions by: ')
    .then(P.sepBy(
		person,
		P.alt(
			// Multi-line must go first or else same-line will eat its optional comma
			multilineAuthorsSeparator,
			sameLineAuthorsSeparator
		)
	))
    .skip(optTabSpace);

export let repo: P.Parser<model.Repository> = P.string('// Definitions: ')
    .then(untilEndOfLine)
    .map((url) => {
		return {
			url: utils.untrail(url.replace(/\s/, ''))
		};
	})
	.skip(optTabSpace);

export let header: P.Parser<model.Header> = bomOpt
	.then(P.seq(
		label.skip(linebreak),
		project.skip(linebreak),
		authors.skip(linebreak),
		repo.skip(linebreak)
	))
	.skip(P.all)
	.map((arr) => {
		return <model.Header> {
			label: <model.Label> arr[0],
			project: <model.Project[]> arr[1],
			authors: <model.Author[]> arr[2],
			repository: <model.Repository> arr[3]
		};
	});
