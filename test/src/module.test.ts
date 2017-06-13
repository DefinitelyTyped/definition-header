'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import * as P from 'parsimmon';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import * as sms from 'source-map-support';
import * as mkdirp from 'mkdirp';

import * as chai from 'chai';

let assert = chai.assert;

sms.install();

import * as DH from '../../src/';

let testDir = path.resolve(__dirname, '..');
let specDir = path.join(testDir, 'fixtures');
let tmpDir = path.join(testDir, 'tmp');
let repoDir = path.join(testDir, '..', 'repo');

function readFields(targetPath: string) {
	let fieldsPath = path.join(path.dirname(targetPath), 'fields.yml');
	return yaml.safeLoad(fs.readFileSync(fieldsPath, {encoding: 'utf8'}), {
		filename: fieldsPath
	});
}

function dump(v: any) {
	console.log(yaml.safeDump(v));
}

function assertPart<T>(parser: any, name: string, value: any) {
	it(name, () => {
		let sourceData = fs.readFileSync(path.join(specDir, 'partials', name, 'header.txt'), {encoding: 'utf8'});
		let actual = parser.skip(P.all).parse(sourceData);
		let expected = {
			status: true,
			value: value
		};
		assert.deepEqual(actual, expected);
	});
}

describe('utils', () => {
	describe('isPartial', () => {
		it('detect partial', () => {
			assert.isTrue(DH.isPartial('// DefinitelyTyped: partial '));
		});
		it('ignore without trailing', () => {
			assert.isFalse(DH.isPartial('// DefinitelyTyped: partial'));
		});
		it('ignore without non-trailing', () => {
			assert.isFalse(DH.isPartial('// DefinitelyTyped: partial-foo'));
		});
		it('ignore bad formed', () => {
			assert.isFalse(DH.isPartial('// DefinitelyTyped: not-partial '));
		});
	});
});

describe('partials', () => {
	describe('label', () => {
		assertPart(DH.parts.label, 'label-basic', {
			name: 'FooModule',
			version: '0.1.23'
		});
		assertPart(DH.parts.label, 'label-modules', {
			name: 'Angular JS (ngMock, ngMockE2E)',
			version: '1.2'
		});
		assertPart(DH.parts.label, 'label-modules-special', {
			name: 'Angular JS (ui.router module)',
			version: '1.2'
		});
		// If we keep '.x' as part of the version number, we should keep '+' too.
		assertPart(DH.parts.label, 'label-plus', {
			name: 'Angular JS',
			version: '1.2+'
		});
		assertPart(DH.parts.label, 'label-simple', {
			name: 'FooModule',
			version: null
		});
	});

	describe('project', () => {
		assertPart(DH.parts.project, 'project-single', [
			{
				url: 'http://foo.org'
			}
		]);
		assertPart(DH.parts.project, 'project-multiline', [
			{
				url: 'http://foo.org'
			},
			{
				url: 'http://bar.org'
			}
		]);
	});

	describe('person', () => {
		assertPart(DH.parts.person, 'person-url-single', {
			name: 'Jimmy',
			url: 'https://github.xyz/x/foo'
		});
		assertPart(DH.parts.person, 'person-url-space', {
			name: 'Jimmy Foo',
			url: 'https://github.xyz/x/foo'
		});
		assertPart(DH.parts.person, 'person-url-special', {
			name: 'Gia Bảo @ Sân Đình',
			url: 'https://github.com/giabao'
		});
	});

	describe('authors', () => {
		assertPart(DH.parts.authors, 'authors-single', [
			{
				name: 'Jimmy Foo',
				url: 'https://github.xyz/x/foo'
			}
		]);
		assertPart(DH.parts.authors, 'authors-separated', [
			{
				name: 'Jimmy Foo',
				url: 'https://github.xyz/x/foo'
			},
			{
				name: 'Billy Bar',
				url: 'https://github.xyz/bar'
			}
		]);
		assertPart(DH.parts.authors, 'authors-multiline', [
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
		assertPart(DH.parts.repo, 'repo', {
			url: 'https://github.com/borisyankov/DefinitelyTyped'
		});
	});
});

describe('headers', () => {

	let files = glob.sync('headers/*/header.txt', {
		cwd: specDir
	});

	files.sort();
	files.forEach((file) => {
		let targetPath = path.join(specDir, file);
		let testName = path.basename(path.dirname(file));

		it(testName, () => {
			let sourceData = fs.readFileSync(targetPath, {encoding: 'utf8'});
			let fields = readFields(targetPath);

			// dump(sourceData);
			// dump(fields);

			let result = DH.parse(sourceData);
			if (fields.valid === false) {
				assert.isFalse(result.success, 'success');
			}
			else {
				if (!result.success) {
					console.log(DH.utils.linkPos(targetPath, result.line, result.column, true));
					console.log('\n' + result.details + '\n');
				}
				assert.isTrue(result.success, 'success');

				let dumpDir = path.join(tmpDir, testName);
				mkdirp.sync(dumpDir);

				/*let serialised = DH.stringify(result.value).join('\n') + '\n';
				fs.writeFileSync(path.join(dumpDir, 'fields.yml'), yaml.safeDump(serialised), {indent: 2});
				fs.writeFileSync(path.join(dumpDir, 'header.txt'), serialised);*/

				assert.deepEqual(result.value, fields.parsed);
			}
		});
	});
});
