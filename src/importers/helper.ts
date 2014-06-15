/// <reference path="./../../typings/tsd.d.ts" />

'use strict';

import model = require('../model');
import schema = require('../schema');
import assertion = require('../assertion');
import lax = require('../parser/lax');
import joiAssert = require('joi-assert');

export function collectPersons(json: any): model.Person[] {
	if (typeof json === 'string') {
		var result = lax.person.parse(json);
		if (result.status) {
			return [result.value];
		}
		return [];
	}
	if (Array.isArray(json)) {
		return json.reduce((memo: model.Person[], x: model.Person) => {
			collectPersons(x).forEach((person) => {
				memo.push(person);
			});
			return memo;
		}, []);
	}
	if (typeof json === 'object') {
		return [
			joiAssert(json, schema.person)
		];
	}
	return [];
}
