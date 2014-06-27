module.exports = function (grunt) {
	'use strict';

	require('source-map-support').install();

	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-ts-clean');
	grunt.loadNpmTasks('grunt-tslint');
	grunt.loadNpmTasks('grunt-dts-bundle');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');

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
				src: ['dist/**/*', '!dist/definition-header.d.ts'],
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
			test: {
				src: ['test/src/*.ts'],
				outDir: 'test/tmp/'
			}
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			},
			all: {
				src: 'test/tmp/*.test.js'
			},
			module: {
				src: 'test/tmp/module.test.js'
			},
			repo: {
				src: 'test/tmp/repo.test.js'
			}
		},
		dts_bundle: {
			index: {
				options: {
					name: 'definition-header',
					main: 'dist/index.d.ts',
					removeSource: true
				}
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
		'dts_bundle:index'
	]);

	grunt.registerTask('build', [
		'compile',
		'sweep'
	]);

	grunt.registerTask('test', [
		'build',
		'ts:test',
		'mochaTest:all',
		'tslint:test',
		'sweep'
	]);

	grunt.registerTask('prepublish', [
		'build',
		'ts:test',
		'mochaTest:module',
		'tslint:test',
		'sweep',
		'clean:tmp',
		'clean:test'
	]);

	grunt.registerTask('sweep', [
		'clean:cruft',
		'ts_clean:dist'
	]);

	grunt.registerTask('dev', ['ts:typings']);
	grunt.registerTask('debug', ['build']);

	grunt.registerTask('default', ['build']);
};
