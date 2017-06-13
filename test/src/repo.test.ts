'use strict';

import * as fs from 'fs';
import * as path from 'path';

import * as glob from 'glob';
import * as sms from 'source-map-support';

import * as chai from 'chai';

let assert = chai.assert;

sms.install();

import * as DH from '../../src/';

let testDir = path.resolve(__dirname, '..');
let repoDir = path.join(testDir, '..', 'repo');

describe('full repo', () => {
	if (!fs.existsSync(repoDir)) {
		return;
	}

	let files = glob.sync('types/*/index.d.ts', {
		cwd: repoDir
	});

	files.sort();

	files.forEach((file) => {
		let targetPath = path.join(repoDir, file);

		it(file, () => {
			let sourceData = fs.readFileSync(targetPath, {encoding: 'utf8'});
			let result = DH.parse(sourceData);
			if (!result.success) {
				if (DH.isPartial(sourceData)) {
					return;
				}
				console.log(DH.utils.linkPos(targetPath, result.line, result.column));
				console.log('\n' + result.details + '\n');
			}
			assert.isTrue(result.success, result.message);
		});
	});
});
