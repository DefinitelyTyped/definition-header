/// <reference path="./../../typings/tsd.d.ts" />

'use strict';

import model = require('../model');
import cnst = require('../const');
import assertion = require('../assertion');

import helper = require('./helper');

function importer(json: any): model.Header {
	assertion.object(json, 'json');

	var header: model.Header = {
		label: {
			name: json.name,
			version: json.version
		},
		project: [
			{
				url: json.homepage
			}
		],
		repository: {
			url: cnst.REPOSITORY
		},
		authors: helper.collectPersons(json.author ? [json.author] : json.authors)
	};
	return header;
}

export = importer;
