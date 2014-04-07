/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/bluebird/bluebird.d.ts" />
/// <reference path="../../typings/js-yaml/js-yaml.d.ts" />
/// <reference path="../../typings/source-map-support/source-map-support.d.ts" />
/// <reference path="../../typings/exit/exit.d.ts" />
/// <reference path="../../dist/index.d.ts" />

'use strict';

// import assert = require('assert');
import path = require('path');
import fsori = require('fs');
import Promise = require('bluebird');
import yaml = require('js-yaml');
import sms = require('source-map-support');
import DH = require('definition-header');
import exit = require('exit');

var isDeepEqual: (a: any, b: any) => boolean = require('deep-eql');
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

var baseDir = './test/fixtures';

function getDirs(base: string): Promise<string[]> {
	'use strict';

	return fs.readdir(base).then((files: string[]) => {
		return Promise.filter(files, (file) => {
			return fs.stat(path.join(base, file)).then((stat) => {
				return stat.isDirectory();
			});
		});
	});
}

/* tslint:disable:no-unused-variable:*/
function getFiles(base: string): Promise<string[]> {
	'use strict';

	return fs.readdir(base).then((files: string[]) => {
		return Promise.filter(files, (file) => {
			return fs.stat(path.join(base, file)).then((stat) => {
				return stat.isFile();
			});
		});
	});
}
/* tslint:enable:no-unused-variable:*/

function getTests(base): Promise<any[]> {
	'use strict';

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
	'use strict';

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
		report.results.filter(res => !!res.result.pass).forEach((res) => {
			if (res.result.header) {
				var serialised = definitionHeader.serialise(res.result.header).join('\n') + '\n';
				// TODO write to disk and compare with a fixture
				console.log(serialised);
			}
			if (res.result.error) {
				console.log(res.result.error);
			}
		});

		if (report.failed > 0) {
			report.results.filter(res => !res.result.pass).forEach((res) => {
				console.log(res.test.group + '/' + res.test.name);
				console.log('---');
				if (res.result.header) {
					console.log(formatter.getStyledDiff(res.result.header, res.fields.parsed));
					console.log('---');
				}
				if (res.result.error) {
					console.log(res.result.error);
					console.log('---');
				}
				console.log('');
			});
		}
	});
	if (!reports.every(report => report.failed === 0)) {
		exit(1);
	}
	console.log('done!');
	exit(0);
}).catch((e) => {
	console.log(e);
	exit(2);
});
