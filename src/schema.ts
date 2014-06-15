/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import Joi = require('joi');

import model = require('./model');
import regex = require('./regex');

export var semver = Joi.string().regex(regex.semverC).description('semver');
export var uri = Joi.string().regex(regex.uri).description('url');

export var label = Joi.object({
	name: Joi.string().regex(regex.nameUTF).required(),
	version: Joi.string().allow(null).regex(regex.semverC).description('semver').optional()
}).description('label');

export var project = Joi.object({
	url: Joi.string().regex(regex.uri).required()
}).description('project');

export var person = Joi.object({
	name: Joi.string().regex(regex.nameUTF).required(),
	url: Joi.string().allow(null).regex(regex.uri).optional().default(null)
}).description('person');

export var repository = Joi.object({
	// use default?
	url: Joi.string().regex(regex.uri).required()
}).description('repository');

export var header = Joi.object({
	label: label.required(),
	project: Joi.array().min(1).includes(project).required(),
	repository: repository.required(),
	authors: Joi.array().min(1).includes(person).required()
}).description('definition-header').options({
	allowUnknown: true,
	stripUnknown: true,
	convert: false
});
