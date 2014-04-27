// Type definitions for PEG.js
// Project: http://pegjs.majda.cz/
// Definitions by: vvakame <https://github.com/vvakame>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module PEG {
	function parse(input: string, options?: IParseOptions): any;
	function buildParser(grammaer: string, options?: IBuildOptions): any;

	var SyntaxError: ISyntaxErrorStatic;

	interface IParseOptions {
		startRule: any;
	}
	interface IBuildOptions {
		cache?: boolean;
		allowedStartRules?: any[];
		output?: string; // parser, source
		optimize?: string; // speed, size
		plugins?: any[];
	}

	interface ISyntaxErrorStatic {
		new (message: string, expected: string, found: string, offset: number, line: number, column: number): ISyntaxError;
	}

	interface ISyntaxError extends Error {
		message: string;
		expected: string;
		found: string;

		line: number;
		column: number
		offset: number;

		name:string;
	}
}

declare module 'pegjs' {
	export = PEG;
}
