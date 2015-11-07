'use strict';

import fs = require('fs');
import path = require('path');
import util = require('util');

import P = require('parsimmon');
import glob = require('glob');
import sms = require('source-map-support');

import chai = require('chai');

var assert = chai.assert;

sms.install();

import DH = require('../../src/');

var testDir = path.resolve(__dirname, '..');
var repoDir = path.join(testDir, '..', 'repo');

describe('full repo', () => {
	if (!fs.existsSync(repoDir)) {
		return;
	}

	var files = glob.sync('*/*.d.ts', {
		cwd: repoDir
	});

	files.sort();

	files.forEach((file) => {
		var targetPath = path.join(repoDir, file);

		it(file, () => {
			var sourceData = fs.readFileSync(targetPath, {encoding: 'utf8'});
			var result = DH.parse(sourceData);
			if (!result.success) {
				if (DH.isPartial(sourceData)) {
					return;
				}
				console.log(DH.utils.linkPos(targetPath, result.line, result.column, true));
				console.log('\n' + result.details + '\n');
			}
			assert.isTrue(result.success);
		});
	});
});
