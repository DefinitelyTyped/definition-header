/// <reference path="./../typings/tsd.d.ts" />

'use strict';

var lineExp = /\r?\n/g;

export interface Position {
	column: number;
	line: number;
}

export function getPosition(stream: string, index: number): Position {
	var position = {
		column: 0,
		line: 0
	};
	var match: RegExpExecArray;
	var nextLineStart = 0;
	lineExp.lastIndex = 0;

	while ((match = lineExp.exec(stream))) {
		if (lineExp.lastIndex > index) {
			position.column = index - nextLineStart;
			return position;
		}
		position.line += 1;
		nextLineStart = lineExp.lastIndex + match[0].length + 1;
	}
	position.column = index - nextLineStart;
	return position;
}

export function getLinesAt(stream: string, start: number, end: number = 0): string[] {
	// TODO improve line grabber (remove horrible split for top-down line parser)
	var arr = stream.split(lineExp);
	start = Math.max(start, 0);
	if (!end) {
		end = arr.length - 1;
	}
	else {
		end = Math.min(end, arr.length - 1);
	}
	end = Math.max(end, start + 1);
	return arr.slice(start, end + 1);
}

export function untrail(str: string): string {
	if (typeof str !== 'string') {
		return String(str);
	}
	return str.replace(/\/$/, '');
}

var longString = '----------------------------------------';

export function charPointer(column: number): string {
	if (longString.length < column) {
		for (var i = longString.length; i < column; i++) {
			longString += '-';
		}
	}
	return longString.substr(0, column - 1) + '^';
}

export function highlightPos(stream: string, line: number, column?: number): string {
	var lines = getLinesAt(stream, 0, line + 2);
	if (typeof column === 'number') {
		lines.splice(line + 1, 0, charPointer(column));
	}
	return lines.join('\n');
}

export function linkPos(dest: string, line?: number, column?: number, oneBased: boolean = false): string {
	if (typeof column !== 'number') {
		column = 0;
	}
	if (typeof line !== 'number') {
		line = 0;
	}
	if (oneBased) {
		column += 1;
		line += 1;
	}
	// return path.resolve(dest) + '[' + line + ',' + column + ']';
	return dest + '[' + line + ',' + column + ']';
}
