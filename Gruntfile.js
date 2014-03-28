module.exports = function (grunt) {
	'use strict';

	var path = require('path');

	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-tslint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-wrap');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.initConfig({
		tslint: {
			options: {
				configuration: grunt.file.readJSON('tslint.json'),
				formatter: 'tslint-path-formatter'
			},
			src: ['src/**/*.ts'],
			test: ['test/src/**/*.ts']
		},
		clean: {
			dist: [
				'dist/**/*'
			],
			test: [
				'test/tmp/**/*'
			]
		},
		ts: {
			options: {
				fast: true,
				target: 'es5',
				module: 'commonjs',
				sourcemap: true,
				declaration: true,
				comments: true,
				verbose: true
			},
			index: {
				options: {
					noImplicitAny: true
				},
				src: ['src/index.ts'],
				outDir: 'dist/'
			},
			tester: {
				src: ['test/src/tester.ts'],
				outDir: 'test/tmp/'
			}
		},
		shell: {
			index: {
				command: 'node ./dist/index.js',
				options: {
					failOnError: true,
					stdout: true
				}
			},
			tester: {
				command: 'node ./test/tmp/tester.js',
				options: {
					failOnError: true,
					stdout: true
				}
			}
		},
		wrap: {
			module: {
				expand:  true,
				src: ['index.d.ts'],
				cwd:  'dist/',
				dest: 'dist/',
				options: {
					wrapper: function(filepath, options) {
						return ['declare module \'' + require('./package.json').name + '\' {\n', '\n}\n'];
					}
				}
			},
			index: {
				expand:  true,
				src: ['*.d.ts'],
				cwd:  'dist/',
				dest: 'dist/',
				options: {
					wrapper: function(filepath, options) {
						return ['declare module \'' + path.basename(filepath).replace(/\.d\.ts$/, '') + '\' {\n', '\n}\n'];
					}
				}
			}
		}
	});

	grunt.registerTask('wrap_module', function() {
		var pkg = require('./package.json');
		var code = grunt.file.read('./dist/index.d.ts');
		var head = [
			'// Type definitions for ' + pkg.name + ' ' + pkg.version,
			'// Project: ' + pkg.homepage,
			'// Definitions by: ' + (pkg.autors || pkg.author ? [pkg.author] : []).map(function(auth) {
				return auth.name + ' <' + auth.url + '>';
			}).join(', '),
			'// Definitions: https://github.com/borisyankov/DefinitelyTyped'
		];
		code = code.replace(/^export declare /gm, 'export ');
		code = head.join('\n') + '\n\n' + 'declare module \'' +pkg.name + '\' {\n\n' + code + '\n}\n';
		grunt.file.write('./dist/index.d.ts', code);
	});

	grunt.registerTask('prep', [
		'clean:dist',
		'clean:test'
	]);
	grunt.registerTask('build', [
		'prep',
		'ts:index',
		'wrap_module',
		'tslint:src'
	]);
	grunt.registerTask('test', [
		'build',
		'ts:tester',
		'tslint:test',
		'shell:index',
		'shell:tester'
	]);

	grunt.registerTask('default', ['build']);
};
