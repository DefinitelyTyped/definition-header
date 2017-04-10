module.exports = function (grunt) {
	'use strict';

	require('source-map-support').install();

	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-tslint');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		exec: {
			tsc: "tsc -p ./"
		},
		tslint: {
			options: {
				configuration: grunt.file.readJSON('tslint.json')
			},
			src: ['src/**/*.ts'],
			test: ['test/src/**/*.ts']
		},
		clean: {
			ts: [
				'src/**/*.js',
				'src/**/*.js.map'
			],
			cruft: [
				'tscommand-*.tmp.txt',
				'test/src/.baseDir*'
			],
			tmp: [
				'tmp/**/*'
			],
			test: [
				'test/tmp/**/*'
			]
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			},
			all: {
				src: 'test/src/*.test.js'
			},
			module: {
				src: 'test/src/module.test.js'
			},
			repo: {
				src: 'test/src/repo.test.js'
			}
		}
	});

	grunt.registerTask('prep', [
		'clean:tmp',
		'clean:test',
		'clean:cruft',
		'clean:ts'
	]);

	grunt.registerTask('compile', [
		'prep',
		'exec:tsc',
		'tslint'
	]);

	grunt.registerTask('build', [
		'compile'
	]);

	grunt.registerTask('test', [
		'build',
		'mochaTest:all'
	]);

	grunt.registerTask('prepublish', [
		'build',
		'mochaTest:module'
	]);

	grunt.registerTask('debug', ['build']);

	grunt.registerTask('default', ['build']);
};
