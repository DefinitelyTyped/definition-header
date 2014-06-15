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
		var actual = parser.skip(lineBreak).parse(sourceData);
		var expected = {
			status: true,
			value: value
		};
		assert.deepEqual(actual, expected);
	});
}

describe('partials', () => {
	describe('label', () => {
		assertPartial(DH.parts.label, 'label', {
			name: 'FooModule',
			version: '0.1.23'
		});
	});

	describe('project', () => {
		assertPartial(DH.parts.project, 'project', {
			url: 'http://foo.org'
		});
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

			var result: DefinitionHeader.Result = DH.parse(sourceData);
			if (fields.valid === false) {
				assert.isFalse(result.success, 'success');
			}
			else {
				if (!result.success) {
					dump(result);
				}
				assert.isTrue(result.success, 'success');

				var dumpDir = path.join(tmpDir, testName);
				mkdirp.sync(dumpDir);
				var serialised = DH.stringify(result.value).join('\n') + '\n';
				fs.writeFileSync(path.join(dumpDir, 'fields.yml'), yaml.safeDump(serialised), {indent: 2});
				fs.writeFileSync(path.join(dumpDir, 'header.txt'), serialised);

				assert.deepEqual(result.value, fields.parsed);

			}
		});
	});
});
