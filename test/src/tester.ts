/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../dist/index.d.ts" />

import assert = require('assert');
import path = require('path');
import util = require('util');
import fsori = require('fs');
import Promise = require('bluebird');
import DH = require('definition-header');

'use strict';

var yaml = require('js-yaml');
var sms = require('source-map-support');
sms.install();

var definitionHeader: typeof DH = require('../../dist/index');

var fs = {
	readFile: Promise.promisify(fsori.readFile),
	readYaml: function (src) {
		return fs.readFile(src, {encoding: 'utf8'}).then((content) => {
			return yaml.safeLoad(content, {
				filename: src
			});
		});
	},
	readUTF8: function (src) {
		return fs.readFile(src, {encoding: 'utf8'});
	},
	readdir: Promise.promisify(fsori.readdir),
	stat: Promise.promisify(fsori.stat)
};

console.log('hah');

var baseDir = './test/fixtures';

function getDirs(base: string): Promise<string[]> {
	return fs.readdir(base).then((files: string[]) => {
		return Promise.filter(files, (file) => {
			return fs.stat(path.join(base, file)).then((stat) => {
				return stat.isDirectory();
			});
		});
	});
}

function getFiles(base: string): Promise<string[]> {
	return fs.readdir(base).then((files: string[]) => {
		return Promise.filter(files, (file) => {
			return fs.stat(path.join(base, file)).then((stat) => {
				return stat.isFile();
			});
		});
	});
}

function getTests(base): Promise<any[]> {
	return fs.readYaml(path.join(base, 'conf.yml')).catch((e) => {
		return {};
	}).then((conf) => {
		return getDirs(base).map((group) => {
			return getDirs(path.join(base, group)).then((tests: string[]) => {
				return {
					name: group,
					conf: conf,
					tests: tests.map((name: string) => {
						return {
							group: group,
							name: name,
							full: path.resolve(base, group, name)
						};
					})
				};
			});
		});
	});
}

function runTests(tests): Promise<any[]> {
	return Promise.map(tests, (test: any) => {
		console.log(test.name);
		return Promise.all([
			fs.readUTF8(path.join(test.full, 'header.txt')),
			fs.readYaml(path.join(test.full, 'fields.yml'))
		]).spread((source, fields) => {
			var result;
			try {
				var h = definitionHeader.parse(source);
				result = {
					header: h
				};
			}
			catch (e) {
				result = {
					error: e
				};
			}
			return {
				test: test,
				source: source,
				fields: fields,
				result: result
			};
		});
	});
}

getTests(baseDir).then((groups) => {
	console.log('---');
	return Promise.all(groups.filter((group) => {
		return group.name === 'core';
	}).map((group) => {
		return runTests(group.tests).then((result) => {
			return {
				group: group,
				results: result
			};
		});
	}));
}).then((res: any[]) => {
	console.log('---');
	console.log(util.inspect(res, false, 10));
	console.log('');
	console.log('hoop!');
	return res;
}).catch((e) => {
	console.log(e);
	process.exit(1);
});
