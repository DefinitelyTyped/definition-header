'use strict';

import * as assertion from './assertion';
import * as serialise from './serialise';
import * as regex from './regex';

import * as parseLax from './parser/lax';

import {ParseResult as Result} from './parser/result';

import * as model from './model';
import * as utils from './utils';
export {
    model,
    utils,
    Result,
};

export let parts = parseLax;

export function isPartial(source: string): boolean {
	return regex.partial.test(source);
}

export function parse(source: string): Result {
	if (regex.bomStart.test(source)) {
		source = source.replace(regex.bomStart, '');
	}

	let result = parseLax.header.parse(source);
	let ret: Result = {
		success: !!result.status
	};
	if (result.status === true) {
		ret.value = result.value;
		return ret;
	}
	ret.index = result.index.offset;

	ret.line = result.index.line;
	ret.column = result.index.column;

	ret.message = 'expected ' + result.expected[0].replace(/"/, '\"') + ' at line ' + ret.line + ', column ' + ret.column;

	let details = '';

	details += ret.message + ':';
	details += '\n\n';
	details += utils.highlightPos(source, ret.line, ret.column);
	details += '\n';

	ret.details = details;

	return ret;
}

export function stringify(header: model.Header): string[] {
	return serialise.stringify(header);
}

export function assert(header: model.Header): model.Header {
	return assertion.header(header);
}
