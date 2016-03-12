'use strict';

import * as XRegExp from 'xregexp';

/* tslint:disable:max-line-length:*/

export let bom = /\uFEFF/;
export let bomStart = /^\uFEFF/;
export let bomOpt = /\uFEFF?/;

// export let label = /[a-z](?:[ _\.-]?[a-z0-9]+)*/i;
// TODO kill parenthesis
export let labelX = /[a-z](?:(?:[ _\.-]| [\/@-] )?\(?[a-z0-9]+\)?)*/i;
export let labelY = /[a-z](?:(?:[ _\.-]| [\/@-] )?\(?[a-z0-9]+(?:, [a-z0-9]+)\)?)*/i;

export let labelZ = /[a-z0-9]*(?:[ _\.-]?[a-z0-9]*)*/i;

export let label = /[a-z](?:(?:[ _\.'-]| [\/@-] )?[a-z0-9]+:?)*\+?/i;

export let semverC = /\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?/;
export let semverV = /v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)\+?/;
export let semverExtract = /^(.+?)[ -]v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)\+?$/;
export let semverE = /[ -]v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)\+?$/;

// https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
export let uri = /((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;

// global unity in unicode
export let name = /[a-z][a-z0-9]*(?:(?:\. |[ _\.\/-]| [\/@-] )?[a-z0-9]+)*\.?/i;
export let nameUTF = XRegExp('[\\p{L}0-9]+(?:(?:\\. |[ _\\.\\/-]| [\\/@-] )?[\\p{L}0-9]+)*\\.?');
// export let nameUTF = XRegExp('\\p{L}+(?:[ \\.@-]\\p{L}+)*');

export let partial = /^\uFEFF?\/\/ DefinitelyTyped: partial\s/;

/* tslint:enable:max-line-length:*/
