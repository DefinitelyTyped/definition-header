/* jshint -W098 */
/* jshint -W083 */

module.exports = function (grunt) {
	'use strict';

	var path = require('path');
	var assert = require('assert');

	require('source-map-support').install();

	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-tslint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-wrap');
	grunt.loadNpmTasks('grunt-typescript-export');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadTasks('./tasks');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: grunt.util._.extend(grunt.file.readJSON('.jshintrc'), {
				reporter: './node_modules/jshint-path-reporter'
			}),
			support: {
				options: {
					node: true
				},
				src: ['Gruntfile.js', 'tasks/**/*.*.js']
			}
		},
		tslint: {
			options: {
				configuration: grunt.file.readJSON('tslint.json'),
				formatter: 'tslint-path-formatter'
			},
			src: ['src/**/*.ts'],
			test: ['test/src/**/*.ts']
		},
		clean: {
			cruft: [
				'tscommand-*.tmp.txt',
				'dist/.baseDir*',
				'test/tmp/.baseDir*',
				'test/src/.baseDir*'
			],
			dist: [
				'dist/**/*'
			],
			tmp: [
				'tmp/**/*'
			],
			test: [
				'test/tmp/**/*'
			]
		},
		ts: {
			options: {
				fast: 'never',
				target: 'es5',
				module: 'commonjs',
				sourcemap: true,
				declaration: true,
				comments: true,
				verbose: true
			},
			build: {
				options: {
					noImplicitAny: true
				},
				src: ['src/**/*.ts'],
				outDir: 'dist/'
			},
			typings: {
				options: {
					fast: 'never',
					noImplicitAny: true
				},
				src: ['typings/**/*.ts'],
				outDir: 'tmp/'
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
		typescript_export: {
			module: {
				src: ['dist/*.d.ts'],
				dest: 'dist/index_wrap.d.ts'
			}
		},
		wrap: {
			module: {
				expand: true,
				src: ['index.d.ts'],
				cwd: 'dist/',
				dest: 'dist/',
				options: {
					wrapper: function (filepath, options) {
						return ['declare module \'' + require('./package.json').name + '\' {\n', '\n}\n'];
					}
				}
			},
			index: {
				expand: true,
				src: ['*.d.ts'],
				cwd: 'dist/',
				dest: 'dist/',
				options: {
					wrapper: function (filepath, options) {
						return ['declare module \'' + path.basename(filepath).replace(/\.d\.ts$/, '') + '\' {\n', '\n}\n'];
					}
				}
			}
		},
		export_declaration: {
			index: {
				options: {
					main: 'dist/index.d.ts'
				},
				src: ['dist/**/*.d.ts']
			}
		}
	});

	grunt.registerTask('prep', [
		'clean:tmp',
		'clean:dist',
		'clean:test',
		'jshint:support'
	]);

	grunt.registerTask('build', [
		'prep',
		'ts:build',
		'tslint:src',
		// 'typescript_export:module',
		'export_declaration:index',
		'sweep',
	]);

	grunt.registerTask('test', [
		'build',
		'ts:tester',
		'tslint:test',
		'shell:index',
		'shell:tester',
		'sweep',
	]);

	grunt.registerTask('sweep', [
		'clean:cruft'
	]);

	grunt.registerTask('dev', ['ts:typings']);
	grunt.registerTask('debug', ['build']);

	grunt.registerTask('default', ['build']);
};
