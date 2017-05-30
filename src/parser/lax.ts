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

export let person: P.Parser<model.Person> = P.seq(
		nameUTF,
		space.then(urlBracket)
	)
	.map((arr) => {
		return {
			name: arr[0],
			url: arr[1] ? utils.untrail(arr[1]) : null
		};
	})
	.skip(optTabSpace);

export let label: P.Parser<model.Label> = P
	// Starts with '// Type definitions for '
	.string('// Type definitions for ')
	// Grab the rest of the line
    .then(P.takeWhile((c) => {
		return c !== '\r' &&
			c !== '\n';
	}))
	.map((result) => {
		// Label is everything that is not the version number
		// Version number is separated from the label by a space
		// - Expected format is MAJOR.MINOR but authors might deviate from it
		// - Can be omitted
		// - Can have leading 'v'
		// - Can have trailing 'x'
		// - Can have trailing '+'
		// - Can be in the middle of the label
		// - Can indicate multiple versions (e.g. '1.10.x / 2.0.x')
		let match = /(.*)[ \-](v?[\d.x+ /]+)(.*)/i.exec(result);
		let label: string = null;
		let semver: string = null;
		if (match) {
			label = match[1];
			// If the version number is in the middle of the label, concatenate the disconnected part
			if (match[3]) {
				label += ' ' + match[3];
			}
			label = label.trim();
			semver = match[2].trim();
		} else {
			label = result;
		}
		return {
			name: label,
			version: semver
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
	.skip(optTabSpace);

export let authors: P.Parser<model.Author[]> = P.string('// Definitions by: ')
	.then(P.alt(
		P.seq(
			person.notFollowedBy(separatorComma),
			linebreak.skip(P.string('//                 ')).then(person).many()
		),
		P.seq(
			person,
			separatorComma.then(person).many()
		)))
	.map((arr) => {
		let ret = <model.Author[]> arr[1];
		ret.unshift(<model.Author> arr[0]);
		return ret;
	})
	.skip(optTabSpace);

export let repo: P.Parser<model.Repository> = P.string('// Definitions: ')
	.then(url)
	.map((url) => {
		return {
			url: utils.untrail(url)
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
