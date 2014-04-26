/// <reference path="./../typings/tsd.d.ts" />

'use strict';

var lineExp = /\r?\n/g;

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

export function charPointer(col: number): string {
	var str = '';
	for (var i = 0; i < col - 1; i++) {
		str += '-';
	}
	return str + '^';
}

export function highlightPos(stream: string, row: number, col?: number): string {
	var lines = getLinesAt(stream, 0, row + 2);
	if (typeof col === 'number') {
		lines.splice(row + 1, 0, charPointer(col));
	}
	return lines.join('\n');
}

export function linkPos(dest: string, row?: number, col?: number, add: boolean = false): string {
	if (typeof col !== 'number') {
		col = 0;
	}
	if (typeof row !== 'number') {
		row = 0;
	}
	if (add) {
		col += 1;
		row += 1;
	}
	// return path.resolve(path.normalize(dest)) + '[' + row + ',' + col + ']';
	return dest + '[' + row + ',' + col + ']';
}
