// Type definitions for joi-assert 0.0.2
// Project: https://github.com/Bartvs/joi-assert
// Definitions by: Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module 'joi-assert' {
	import Joi = require('joi');

	function joiAssert<U>(value: U, schema: Joi.Schema, message?: string, vars?: any): U;
	function joiAssert<U>(value: any, schema: Joi.Schema, message?: string, vars?: any): any;

	module joiAssert {
		export interface JoiAssertion<U> {
			(value: any, vars?: any): U;
		}
		export function bake<U>(schema: Joi.Schema, message?: string): JoiAssertion<U>;
	}

	export = joiAssert;
}
