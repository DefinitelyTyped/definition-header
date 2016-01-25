'use strict';

import * as Joi from 'joi';
import * as joiAssert from 'joi-assert';

import * as model from './model';
import * as schema from './schema';
import * as regex from './regex';

export let ok = joiAssert.bake(Joi.any());
export let number = joiAssert.bake(Joi.number());
export let string = joiAssert.bake(Joi.string());
export let object = joiAssert.bake(Joi.object());
export let array = joiAssert.bake(Joi.array());
export let uri = joiAssert.bake(schema.uri);
export let semver = joiAssert.bake(schema.semver);

export function label(obj: any, message?: string): model.Label {
	return joiAssert(obj, schema.label, message);
}
export function project(obj: any, message?: string): model.Project {
	return joiAssert(obj, schema.project, message);
}
export function person(obj: any, message?: string): model.Person {
	return joiAssert(obj, schema.person, message);
}
export function repository(obj: any, message?: string): model.Repository {
	return joiAssert(obj, schema.repository, message);
}
export function header(obj: any, message?: string): model.Header {
	return joiAssert(obj, schema.header, message);
}
