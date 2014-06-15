/// <reference path="./../typings/tsd.d.ts" />

'use strict';

import X = require('xregexp');
import XRegExp = X.XRegExp;

/* tslint:disable:max-line-length:*/

export var bom = /\uFEFF/;
export var bomStart = /^\uFEFF/;
export var bomOpt = /\uFEFF?/;

// export var label = /[a-z](?:[ _\.-]?[a-z0-9]+)*/i;
// TODO kill parenthesis
export var label = /[a-z](?:(?:[ _\.-]| [\/@-] )?\(?[a-z0-9]+\)?)*/i;

export var semverC = /\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?/;
export var semverV = /v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)/;
export var semverExtract = /^(.*?)[ -]v?(\d+(?:\.\d+)+(?:-[a-z_]\w*(?:\.\d+)*)?)$/;

// https://stackoverflow.com/questions/6927719/url-regex-does-not-work-in-javascript
export var uri = /((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;

// global unity in unicode
export var name = /[a-z]+(?:(?:\. |[ _\.-]| [\/@-] )?[a-z0-9]+)*/i;
export var nameUTF = XRegExp('\\p{L}+(?:(?:\\. |[ _\\.-]| [\\/@-] )?\\p{L}+)*');
// export var nameUTF = XRegExp('\\p{L}+(?:[ \\.@-]\\p{L}+)*');


/* tslint:enable:max-line-length:*/
