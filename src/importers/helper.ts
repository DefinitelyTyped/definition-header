/// <reference path="./../../typings/tsd.d.ts" />

'use strict';

import model = require('../model');
import assertion = require('../assertion');
import lax = require('../parser/lax');

export function collectPersons(json: any): model.Person[] {
	if (typeof json === 'string') {
		return [lax.person.parse(json)];
	}
	else if (Array.isArray(json)) {
		return json.reduce((memo: model.Person[], x: model.Person) => {
			collectPersons(x).forEach((person) => {
				memo.push(person);
			});
			return memo;
		}, []);
	}
	if (typeof json === 'object') {
		return [{
			name: json.name,
			url: json.url
		}];
	}
	return [];
}
