/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import assertion = require('./assertion');
import serialise = require('./serialise');

import parseLax = require('./parser/lax');
import parseStrict = require('./parser/strict');

export import model = require('./model');
export import importer = require('./importers/index');
export import utils = require('./utils');

[model, importer, utils];

export function parse(source: string, strict: boolean): model.Header {
	// TODO add strict parser
	var header: model.Header;
	/*if (strict) {
		header = parseStrict.header.parse(source);
	}
	else {*/
		header = parseLax.header.parse(source);
	// }
	return header;
}

export function stringify(header: model.Header): string[] {
	return serialise.stringify(header);
}

export function assert(header: model.Header): model.Header {
	return assertion.header(header);
}
