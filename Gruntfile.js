module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	gitclone: {
		docs: {
			options: {
				directory: "site",
				repository: "https://github.com/SockDrawer/SockBot.git",
				branch: "gh-pages"
			}
		}
	},
	mkdocs: {
		dist: {
		  src: '.',
		  options: {
			clean: true
		  }
		}
	},
	jsdoc : {
        dist : {
            src: ['*.js', 'sock_modules/*.js', 'sock_modules/**/*.js'],
            options: {
                destination: 'site/docs',
                template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                configure: 'jsdoc.conf'
            }
        }
    },
	'gh-pages': {
		options: {
			// The default commit message for the gh-pages branch
			base: 'site',
			message: 'push documentation automatically',
			repo: 'https://' + process.env.GH_TOKEN + '@github.com/SockDrawer/SockBot'
		},
		src: "**"
	},
	simplemocha: {
		options: {
			globals: ['expect'],
			timeout: 3000,
			ignoreLeaks: false,
			ui: 'bdd',
			reporter: 'spec'
		},
		all: { src: ['tests/*.js'] }
	}
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-mkdocs');
  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-simple-mocha')

  // Default task(s).
  grunt.registerTask('generate-docs', ['mkdocs', 'jsdoc', 'gh-pages']);
  grunt.registerTask('local', ['mkdocs', 'jsdoc']);
  grunt.registerTask('default', ['mkdocs', 'jsdoc', 'gh-pages']);
  grunt.registerTask('test', ['simplemocha']);

};
