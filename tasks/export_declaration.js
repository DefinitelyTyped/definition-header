module.exports = function (grunt) {
	'use strict';

	var path = require('path');
	var assert = require('assert');

	var dtsExp = /\.d\.ts$/;
	var bomOptExp = /^\uFEFF?/;

	var externalExp = /^([ \t]*declare module )(['"])(.+?)(\2[ \t]*{?.*)$/;
	var importExp = /^([ \t]*(?:export )?(?:import .+? )= require\()(['"])(.+?)(\2\);.*)$/;
	var referenceTagExp = /^[ \t]*\/\/\/[ \t]*<reference[ \t]+path=(["'])(.*?)\1?[ \t]*\/>.*$/;
	var identifierExp = /^\w+(?:[\.-]\w+)*$/;

	function assertArr(arr, msg) {
		for (var i = 0; i < arr.length; i++) {
			assert(arr[i], i + ' ' + msg);
		}
	}

	function pushUnique(arr, value) {
		if (arr.indexOf(value) < 0) {
			arr.push(value);
		}
		return arr;
	}

	function pushUniqueArr(arr, values) {
		for (var a = 1; a < arguments.length; a++) {
			var tmp = arguments[a];
			for (var i = 0, ii = tmp.length; i < ii; i++) {
				var v = tmp[i];
				if (arr.indexOf(v) < 0) {
					arr.push(v);
				}
			}
		}
		return arr;
	}

	function shiftUnique(arr, value) {
		if (arr.indexOf(value) < 0) {
			arr.shift(value);
		}
		return arr;
	}

	function shiftUniqueArr(arr, values) {
		for (var a = 1; a < arguments.length; a++) {
			var tmp = arguments[a];
			for (var i = 0, ii = tmp.length; i < ii; i++) {
				var v = tmp[i];
				if (arr.indexOf(v) < 0) {
					arr.shift(v);
				}
			}
		}
		return arr;
	}

	function formatReference(file) {
		return '/// <reference path="' + file.replace(/[\\\/]/g, '/') + '" />';
	}

	function extractReference(tag) {
		var match = tag.match(referenceTagExp);
		if (match) {
			return match[2];
		}
		return null;
	}

	function replaceImportExport(line, replacer) {
		var match = line.match(importExp);
		if (match) {
			assert(match[4]);
			if (identifierExp.test(match[3])) {
				return match[1] + match[2] + replacer(match[3]) + match[4];
			}
		}
		return line;
	}

	function replaceExternal(line, replacer) {
		var match = line.match(externalExp);
		if (match) {
			assert(match[4]);
			if (identifierExp.test(match[3])) {
				return match[1] + match[2] + replacer(match[3]) + match[4];
			}
		}
		return line;
	}

	grunt.registerMultiTask('export_declaration', function () {
		var options = this.options({
			main: '.',
			lb: '\r\n',
			idt: '    ',
			modSep: '/',
			modPref: '__'
		});
		var header = require('../dist/index.js');
		var pkg = grunt.file.readJSON('./package.json');

		var main = path.resolve(options.main.replace(/\//g, path.sep));
		var base = path.dirname(main);

		var lb = options.lb;
		var idt = options.idt;
		var modSep = options.modSep;
		var modPref = options.modPref;

		// clean selection
		var selected = this.filesSrc.filter(function (file) {
			return dtsExp.test(file);
		}).map(function (file) {
			return path.resolve(file);
		}).filter(function (file) {
			return file !== main;
		});

		// enclosed helpers
		function getModName(file) {
			return path.relative(base, path.dirname(file) + path.sep + path.basename(file).replace(/\.d\.ts$/, ''));
		}

		function getExpName(file) {
			var isMain = (file === main);
			if (isMain) {
				return pkg.name;
			}
			return getExpNameRaw(file);
		}

		function getExpNameRaw(file) {
			return modPref + pkg.name + modSep + cleanUpName(getModName(file));
		}

		function getLibName(ref) {
			return getExpNameRaw(main) + modSep + modPref + modSep + ref;
		}

		function cleanUpName(name) {
			return name.replace(/\.\./g, '--').replace(/[\\\/]/g, modSep);
		}

		function getReferenceBundle(bundle, refs) {
			var base = path.basename(bundle);
			return refs.map(function (ref) {
				return formatReference(path.relative(base, ref));
			}).join(lb) + lb;
		}

		function formatModule(file, lines) {
			var out = '';
			out += 'declare module \'' + getExpName(file) + '\' {' + lb;
			out += (lines.length === 0 ? '' : idt + lines.join(lb + idt)) + lb;
			out += '}' + lb;
			return out;
		}

		// main info extractor
		function parseFile(file) {
			var name = getModName(file);
			var code = grunt.file.read(file).replace(bomOptExp, '').replace(/\s*$/, '');

			var res = {
				file: file,
				name: name,
				exp: getExpName(file),
				refs: [],
				relates: [],
				exports: [],
				imports: [],
				lines: [],
				// these can hold either string ro single-element arrays
				importLineRef: [],
				relativeRef: []
			};

			code.split(/\r?\n/g).forEach(function (line) {
				// blankline
				if (/^\s*$/.test(line)) {
					res.lines.push('');
					return;
				}
				// reference tag
				if (/^\/\/\//g.test(line)) {
					var ref = extractReference(line);
					if (ref) {
						pushUnique(res.refs, path.resolve(path.dirname(file), ref));
						return;
					}
				}
				var match;

				// import statement
				if ((match = line.match(importExp))) {
					assert(match[3]);

					var impPath = path.resolve(path.dirname(file), match[3]);

					// identifier
					if (identifierExp.test(match[3])) {
						line = [line];
						res.lines.push(line);
						pushUnique(res.imports, match[3]);
					}
					// filename
					else {
						var expName = getExpName(impPath);
						line = [match[1] + match[2] + expName + match[4]];
						res.lines.push(line);

						var full = path.resolve(path.dirname(file), impPath + '.d.ts');
						pushUnique(res.relates, full);
					}
					res.importLineRef.push(line);
				}
				// declaring an external module
				else if ((match = line.match(externalExp))) {
					assert(match[3]);

					pushUnique(res.exports, match[3]);
					line = [line];
					res.relativeRef.push(line);
					res.lines.push(line);
				}
				// clean regular lines
				else {
					if (file === main || selected.indexOf(file) > -1) {
						res.lines.push(line.replace(/^(export )?declare /g, '$1'));
					}
					else {
						res.lines.push(line);
					}
				}
			});

			return res;
		}

		// collections
		var fileMap = Object.create(null);
		var exportMap = Object.create(null);

		// parse the main file
		var mainParse = parseFile(main);
		fileMap[mainParse.file] = mainParse;

		var collect = [];
		var used = [];
		var have = [main];
		var queue = pushUniqueArr([], mainParse.refs, mainParse.relates);

		var parse;

		// process all files and follow imports and references
		while (queue.length > 0) {
			var target = queue.shift();
			if (have.indexOf(target) > -1) {
				continue;
			}
			have.push(target);

			// parse the file
			parse = parseFile(target);
			fileMap[parse.file] = parse;
			pushUniqueArr(queue, parse.refs, parse.relates);
		}

		// map all exports to their file
		Object.keys(fileMap).forEach(function (file) {
			var parse = fileMap[file];
			parse.exports.forEach(function (name) {
				assert(!(name in exportMap), 'already got export for: ' + name);
				exportMap[name] = parse;
			});
		});

		// process references
		collect = [mainParse];
		queue = [mainParse];

		while (queue.length > 0) {
			parse = queue.shift();

			parse.imports.forEach(function (name) {
				var p = exportMap[name];
				pushUnique(queue, p);
				pushUnique(collect, p);
			});
			parse.relates.forEach(function (file) {
				var p = fileMap[file];
				pushUnique(queue, p);
				pushUnique(collect, p);
			});
		}

		// rewrite global external modules to a unique name
		collect.forEach(function (parse) {
			parse.relativeRef.forEach(function (line, i) {
				parse.relativeRef[i][0] = replaceExternal(String(line), getLibName);
			});
			parse.importLineRef.forEach(function (line, i) {
				parse.importLineRef[i][0] = replaceImportExport(String(line), getLibName);
			});
		});

		// output collected content
		var out = '';
		out += header.stringify(header.importer.packageJSON(pkg)).join(lb) + lb;
		out += lb;

		// add wrapped modules to output
		out += collect.map(function (parse) {
			used.push(parse.file);
			//
			if (parse === mainParse || selected.indexOf(parse.file) > -1) {
				return formatModule(parse.file, parse.lines);
			}
			else {
				return parse.lines.join(lb) + lb;
			}
		}).join(lb) + lb;

		// print some debug info
		console.log('all');
		console.log(selected.map(function (p) {
			return ' - ' + p;
		}).join('\n'));
		console.log('used');
		console.log(used.map(function (p) {
			return ' - ' + p;
		}).join('\n'));
		console.log('unused');
		console.log(selected.filter(function (p) {
			return used.indexOf(p) < 0;
		}).map(function (p) {
			return ' - ' + p;
		}).join('\n'));

		// write main file
		grunt.file.write(main, out);
	});
};
