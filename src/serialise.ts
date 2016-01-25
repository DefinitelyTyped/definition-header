'use strict';

import * as model from './model';
import * as assertion from './assertion';

export function stringify(header: model.Header): string[] {
	assertion.header(header);

	let ret: string[] = [];
	ret.push('// Type definitions for ' + header.label.name + (header.label.version ? ' v' + header.label.version : ''));
	ret.push('// Project: ' + header.project.map((project: model.Project) => {
		return project.url ;
	}).join(', '));
	ret.push('// Definitions by: ' + header.authors.map((author: model.Person) => {
		return author.name + (author.url ? ' <' + author.url + '>' : '');
	}).join(', '));
	ret.push('// Definitions: ' + header.repository.url);
	return ret;
}
