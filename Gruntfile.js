module.exports = function (grunt) {
	'use strict';

	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-tslint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.initConfig({
		tslint: {
			options: {
				configuration: grunt.file.readJSON('tslint.json'),
				formatter: 'tslint-path-formatter'
			},
			runner: ['src/**/*.ts']
		},
		clean: {
			runner: [
				'dist/**/*.*',
			]
		},
		ts: {
			options: {
				fast: false,
				target: 'es5',
				module: 'commonjs',
				sourcemap: true,
				declaration: true,
				comments: true,
				verbose: true
			},
			runner: {
				src: ['src/index.ts'],
				outDir: 'dist/'
			},
			tests: {
				src: ['test/src/*.ts'],
				outDir: 'test/tmp/'
			}
		},
		shell: {
			run: {
				command: 'node ./dist/index.js',
				options: {
					failOnError: true,
					stdout: true
				}
			}
		}
	});

	grunt.registerTask('prep', [
		'clean:runner'
	]);
	grunt.registerTask('build', [
		'prep',
		'ts:runner',
		//'tslint:runner'
	]);
	grunt.registerTask('test', [
		'build',
		'shell:run'
	]);

	grunt.registerTask('default', ['build']);
};
