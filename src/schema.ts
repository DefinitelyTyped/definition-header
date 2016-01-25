'use strict';

import * as Joi from 'joi';

import * as model from './model';
import * as regex from './regex';

export let semver = Joi.string().regex(regex.semverC).description('semver');
export let uri = Joi.string().regex(regex.uri).description('url');

export let label = Joi.object({
	name: Joi.string().regex(regex.nameUTF).required(),
	version: Joi.string().allow(null).regex(regex.semverC).description('semver').optional()
}).description('label');

export let project = Joi.object({
	url: Joi.string().regex(regex.uri).required()
}).description('project');

export let person = Joi.object({
	name: Joi.string().regex(regex.nameUTF).required(),
	url: Joi.string().allow(null).regex(regex.uri).optional().default(null)
}).description('person');

export let repository = Joi.object({
	// use default?
	url: Joi.string().regex(regex.uri).required()
}).description('repository');

export let header = Joi.object({
	label: label.required(),
	project: Joi.array().min(1).items(project).required(),
	repository: repository.required(),
	authors: Joi.array().min(1).items(person).required()
}).description('definition-header').options({
	allowUnknown: true,
	stripUnknown: true,
	convert: false
});
