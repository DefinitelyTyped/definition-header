/// <reference path="./../../typings/tsd.d.ts" />

'use strict';

import model = require('../model');

export interface ParseResult {
	success: boolean;
	value?: model.Header;
	message?: string;
	details?: string;
	index?: number;
	line?: number;
	column?: number;
}
