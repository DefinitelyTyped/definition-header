/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import Joi = require('joi');
import joiAssert = require('joi-assert');

import model = require('./model');
import schema = require('./schema');
import regex = require('./regex');

export var ok = joiAssert.bake(Joi.any());
export var number = joiAssert.bake(Joi.number());
export var string = joiAssert.bake(Joi.string());
export var object = joiAssert.bake(Joi.object());
export var array = joiAssert.bake(Joi.array());
export var uri = joiAssert.bake(schema.uri);
export var semver = joiAssert.bake(schema.semver);

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
