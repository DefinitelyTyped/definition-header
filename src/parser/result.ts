'use strict';

import * as model from '../model';

export interface ParseResult {
	success: boolean;
	value?: model.Header;
	message?: string;
	details?: string;
	index?: number;
	line?: number;
	column?: number;
}
