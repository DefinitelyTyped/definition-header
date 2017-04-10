'use strict';

let lineExp = /\r?\n/g;

export function getLinesAt(stream: string, start: number, end: number = 0): string[] {
	// TODO improve line grabber (remove horrible split for top-down line parser)
	let arr = stream.split(lineExp);
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

let longString = '----------------------------------------';

export function charPointer(column: number): string {
	if (longString.length < column) {
		for (let i = longString.length; i < column; i++) {
			longString += '-';
		}
	}
	return longString.substr(0, column) + '^';
}

// TODO harden for deeper lines
export function highlightPos(stream: string, line: number, column?: number): string {
	let lines = getLinesAt(stream, 0, line + 2);
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
