/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../dist/index.d.ts" />

import assert = require('assert');
import path = require('path');
import util = require('util');
import fsori = require('fs');
import Promise = require('bluebird');
import DH = require('definition-header');

'use strict';

var isDeepEqual: (a: any, b: any) => boolean = require('deep-eql');
var yaml = require('js-yaml');
var sms = require('source-map-support');
sms.install();

var definitionHeader: typeof DH = require('../../dist/index');

var DiffFormatter = require('unfunk-diff').DiffFormatter;
var style = require('ministyle').ansi();
var formatter = new DiffFormatter(style, 80);

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

function getDiff() {

}

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
		return Promise.all([
			fs.readUTF8(path.join(test.full, 'header.txt')),
			fs.readYaml(path.join(test.full, 'fields.yml'))
		]).spread((source, fields) => {
			var result;
			try {
				var h = definitionHeader.parse(source);
				result = {
					pass: isDeepEqual(h, fields.parsed),
					header: h
				};
			}
			catch (e) {
				result = {
					pass: (typeof fields.valid !== 'undefined' && fields.valid === false) ? true : false,
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
	var dirs = ['core', 'debug', 'practical'];

	return Promise.all(groups.filter((group) => {
		return dirs.indexOf(group.name) > -1;
	}).map((group) => {
		return runTests(group.tests).then((results) => {
			return {
				group: group,
				failed: results.reduce((memo, res) => {
					return memo + (res.result.pass ? 0 : 1);
				}, 0),
				results: results
			};
		});
	}));
}).then((reports: any[]) => {
	// console.log(util.inspect(reports, false, 10));

	reports.forEach((report) => {
		console.log('');
		console.log(report.group.name);
		console.log('   passed %d of %d', report.results.length - report.failed, report.results.length);
		console.log('');
		if (report.failed > 0) {
			report.results.filter(res => !res.result.pass).forEach((res) => {
				console.log(res.test.group + '/' + res.test.name);
				console.log('---');
				if (res.result.header) {
					console.log(formatter.getStyledDiff(res.fields.parsed, res.result.header));
					console.log('---');
				}
				if (res.result.error) {
					console.log(res.result.error);
					console.log('---');
				}
			});
		}
	});
	if (!reports.every(report => report.failed === 0)) {
		process.exit(1);
	}
	console.log('done!');
}).catch((e) => {
	console.log(e);
	process.exit(2);
});
