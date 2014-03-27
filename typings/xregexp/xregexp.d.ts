

declare module XRegExpModule {
	// scopes: 'default', 'class', or 'all'
	/*
	 Native flags:
	 g - global
	 i - ignore case
	 m - multiline anchors
	 y - sticky (Firefox 3+)
	 Additional XRegExp flags:
	 n - explicit capture
	 s - dot matches all (aka singleline)
	 x - free-spacing and line comments (aka extended)
	 */
	export interface TokenOpts {
		scope?: string;
		trigger?: () => boolean;
		customFlags?: string;
	}

	interface XRegExp {
		(pattern: string, flags?: string): RegExp;
		(pattern: RegExp): RegExp;

		addToken(regex: RegExp, handler: (matchArr: RegExpExecArray, scope: string) => string, options?: TokenOpts): void;

		build(pattern: string, subs: string[], flags?: string): RegExp
		cache(pattern: string, flags?: string): RegExp
		escape(str: string): string;
		exec(str: string, regex: RegExp, pos?: number, sticky?: boolean): RegExpExecArray;
		forEach(str: string, regex: RegExp, callback: (matchArr: RegExpExecArray, index: number, input: string, regexp: RegExp) => void, context?: Object): any;
		globalize(regex: RegExp): RegExp;
		install(options: string): void;
		install(options: Object): void;
		isInstalled(feature: string): boolean;
		isRegExp(value: any): boolean;
		matchChain(str: string, chain: RegExp[]): string[];
		matchRecursive(str: string, left: string, right: string, flags: string, options?: Object)

		replace(str: string, search: string, replacement: string, scope?: string): string;
		replace(str: string, search: string, replacement: Function, scope?: string): string;
		replace(str: string, search: RegExp, replacement: string, scope?: string): string;
		replace(str: string, search: RegExp, replacement: Function, scope?: string): string;

		split(str: string, separator, limit?)
		test(str: string, regex: RegExp, pos?: number, sticky?): boolean;
		uninstall(options)

		union(patterns: string[], flags?: string)
		version: string;
	}
}

declare module 'xregexp' {
	export var XRegExp: XRegExpModule.XRegExp;
}
