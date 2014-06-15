/// <reference path="../../typings/tsd.d.ts" />

/// <reference path="../../dist/index.d.ts" />

'use strict';

import fs = require('fs');
import path = require('path');
import util = require('util');

import P = require('parsimmon');
import glob = require('glob');
import yaml = require('js-yaml');
import sms = require('source-map-support');
import mkdirp = require('mkdirp');

import chai = require('chai');

var assert = chai.assert;

var isDeepEqual: (a: any, b: any) => boolean = require('deep-eql');
sms.install();

import DefinitionHeader = require('definition-header');
var DH: typeof DefinitionHeader = require('../../dist/index');

var testDir = path.resolve(__dirname, '..');
var specDir = path.join(testDir, 'fixtures');
var tmpDir = path.join(testDir, 'tmp');
var repoDir = path.join(testDir, '..', 'repo');

var lineBreak = P.regex(/\r?\n/).desc('linebreak');

function readFields(targetPath) {
	var fieldsPath = path.join(path.dirname(targetPath), 'fields.yml');
	return yaml.safeLoad(fs.readFileSync(fieldsPath, {encoding: 'utf8'}), {
		filename: fieldsPath
	});
}

function dump(v) {
	console.log(yaml.safeDump(v));
}

function assertPartial<T>(parser: any, name: string, value: any) {
	it(name, () => {
		var sourceData = fs.readFileSync(path.join(specDir, 'partials', name, 'header.txt'), {encoding: 'utf8'});
		var actual = parser.skip(P.all).parse(sourceData);
		var expected = {
			status: true,
			value: value
		};
		assert.deepEqual(actual, expected);
	});
}

describe('utils', () => {
	describe('find correct position', () => {
		var str = [
			'a',
			'b',
			'c',
			'd'
		].join('\n');

		var tests = [
			[0, {line: 0, column: 0}],
			[1, {line: 0, column: 1}],
			[2, {line: 1, column: 0}],
			[3, {line: 1, column: 1}],
			[4, {line: 2, column: 0}],
			[5, {line: 2, column: 1}],
			[6, {line: 3, column: 0}],
			[7, {line: 3, column: 0}],
			[8, {line: 3, column: 0}],
		];
		tests.forEach((test: any, i: number) => {
			it('test #' + i, () => {
				assert.deepEqual(DH.utils.getPosition(str, test[0]), test[1]);
			});
		});
	});
});

describe('partials', () => {
	describe('label', () => {
		assertPartial(DH.parts.label, 'label-basic', {
			name: 'FooModule',
			version: '0.1.23'
		});
		assertPartial(DH.parts.label, 'label-modules', {
			name: 'Angular JS (ngMock, ngMockE2E)',
			version: '1.2'
		});
		assertPartial(DH.parts.label, 'label-modules-special', {
			name: 'Angular JS (ui.router module)',
			version: '1.2'
		});
		assertPartial(DH.parts.label, 'label-plus', {
			name: 'Angular JS',
			version: '1.2'
		});
		assertPartial(DH.parts.label, 'label-simple', {
			name: 'FooModule',
			version: null
		});
	});

	describe('project', () => {
		assertPartial(DH.parts.project, 'project-single', [
			{
				url: 'http://foo.org'
			}
		]);
		assertPartial(DH.parts.project, 'project-multiline', [
			{
				url: 'http://foo.org'
			},
			{
				url: 'http://bar.org'
			}
		]);
	});

	describe('person', () => {
		assertPartial(DH.parts.person, 'person-name-single', {
			name: 'Jimmy',
			url: null
		});
		assertPartial(DH.parts.person, 'person-name-space', {
			name: 'Jimmy Foo',
			url: null
		});
		assertPartial(DH.parts.person, 'person-name-special', {
			name: 'Gia Bảo @ Sân Đình',
			url: null
		});

		assertPartial(DH.parts.person, 'person-url-single', {
			name: 'Jimmy',
			url: 'https://github.xyz/x/foo'
		});
		assertPartial(DH.parts.person, 'person-url-space', {
			name: 'Jimmy Foo',
			url: 'https://github.xyz/x/foo'
		});
		assertPartial(DH.parts.person, 'person-url-special', {
			name: 'Gia Bảo @ Sân Đình',
			url: 'https://github.com/giabao'
		});
	});

	describe('authors', () => {
		assertPartial(DH.parts.authors, 'authors-single', [
			{
				name: 'Jimmy Foo',
				url: 'https://github.xyz/x/foo'
			}
		]);
		assertPartial(DH.parts.authors, 'authors-separated', [
			{
				name: 'Jimmy Foo',
				url: 'https://github.xyz/x/foo'
			},
			{
				name: 'Billy Bar',
				url: 'https://github.xyz/bar'
			}
		]);
		assertPartial(DH.parts.authors, 'authors-multiline', [
			{
				name: 'Jimmy Foo',
				url: 'https://github.xyz/x/foo'
			},
			{
				name: 'Billy Bar',
				url: 'https://github.xyz/bar'
			}
		]);
	});

	describe('repo', () => {
		assertPartial(DH.parts.repo, 'repo', {
			url: 'https://github.com/borisyankov/DefinitelyTyped'
		});
	});
});

describe('headers', () => {

	var files = glob.sync('headers/*/header.txt', {
		cwd: specDir
	});

	files.sort();
	files.forEach((file) => {
		var targetPath = path.join(specDir, file);
		var testName = path.basename(path.dirname(file));

		it(testName, () => {
			var sourceData = fs.readFileSync(targetPath, {encoding: 'utf8'});
			var fields = readFields(targetPath);

			// dump(sourceData);
			// dump(fields);

			var result = DH.parse(sourceData);
			if (fields.valid === false) {
				assert.isFalse(result.success, 'success');
			}
			else {
				if (!result.success) {
					// dump(result);
					console.log(result.details);
				}
				assert.isTrue(result.success, 'success');

				var dumpDir = path.join(tmpDir, testName);
				mkdirp.sync(dumpDir);

				/*var serialised = DH.stringify(result.value).join('\n') + '\n';
				fs.writeFileSync(path.join(dumpDir, 'fields.yml'), yaml.safeDump(serialised), {indent: 2});
				fs.writeFileSync(path.join(dumpDir, 'header.txt'), serialised);*/

				assert.deepEqual(result.value, fields.parsed);
			}
		});
	});
});

describe('repos', () => {
	if (!fs.existsSync(repoDir)) {
		return;
	}

	var files = glob.sync('*/*.d.ts', {
		cwd: repoDir
	});

	files.sort();
	files = files.slice(0, 100);

	files.forEach((file) => {
		var targetPath = path.join(repoDir, file);

		it(file, () => {
			var sourceData = fs.readFileSync(targetPath, {encoding: 'utf8'});
			var result = DH.parse(sourceData);
			if (!result.success) {
				console.log('\n' + result.details + '\n');
			}
			assert.isTrue(result.success);
		});
	});
});
