module.exports = function (grunt) {
	'use strict';

	require('source-map-support').install();

	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-ts-clean');
	grunt.loadNpmTasks('grunt-tslint');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-regex-replace');

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
		ts_clean: {
			dist: {
				src: ['dist/**/*', '!dist/index.d.ts'],
				dot: true
			}
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
				src: ['src/index.ts'],
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
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			},
			tester: {
				src: 'test/tmp/tester.js'
			}
		},
		'regex-replace': {
			cli: {
				src: ['dist/cli.js'],
				actions: [
					{
						name: 'eol',
						search: '\\r\\n',
						replace: '\n',
						flags: 'g'
					}
				]
			}
		},
		export_declaration: {
			index: {
				options: {
					main: 'dist/index.d.ts'
				},
				src: ['dist/**/*.d.ts']
			}
		},
		pegjs: {

		}
	});

	grunt.registerTask('prep', [
		'clean:tmp',
		'clean:dist',
		'clean:test',
		'clean:cruft',
		'jshint:support'
	]);

	grunt.registerTask('compile', [
		'prep',
		'ts:build',
		'tslint:src',
		'export_declaration:index'
	]);

	grunt.registerTask('build', [
		'compile',
		'sweep'
	]);

	grunt.registerTask('test', [
		'build',
		'ts:tester',
		'mochaTest:tester',
		'tslint:test',
		'sweep'
	]);

	grunt.registerTask('sweep', [
		'clean:cruft',
		'ts_clean:dist'
	]);

	grunt.registerTask('prepublish', [
		'test',
		'clean:tmp',
		'clean:test',
		'regex-replace:cli'
	]);

	grunt.registerTask('dev', ['ts:typings']);
	grunt.registerTask('debug', ['build']);

	grunt.registerTask('default', ['build']);
};
