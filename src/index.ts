/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import model = require('./model');
import assertion = require('./assertion');
import serialise = require('./serialise');
import lax = require('./lax');

export import importer = require('./importers/index');
export import utils = require('./utils');

// temp for testing
export import schema = require('./schema');

[utils, importer, schema];

export function parse(source: string, strict: boolean): model.Header {
	// TODO add strict parser
	var header: model.Header = lax.header.parse(source);
	return header;
}

export function stringify(header: model.Header): string[] {
	return serialise.stringify(header);
}

export function assert(header: model.Header): model.Header {
	return assertion.header(header);
}
