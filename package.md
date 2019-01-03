# NPM Packages

## Build

Using [babel 6](https://babeljs.io/) and "env" preset.

## Testing

Using "mocha" for executing tests. the "mocha-lcov-reporter" is required to create the data needed by coverage analysis.

### Coverage

Using ["istanbul"](https://github.com/gotwarlost/istanbul) and its command line client ["nyc"](https://github.com/istanbuljs/nyc).

Babel support in `nyc` provided by [`babel-plugin-istanbul"](https://www.npmjs.com/package/nyc#use-with-babel-plugin-istanbul-for-babel-support).

Coverage data published to ["coveralls"](https://coveralls.io/) using ["coveralls" plugin](https://github.com/nickmerwin/node-coveralls).

## Documentation

Using ["esdoc"](https://esdoc.org/) for generating documentation. It requires the "esdoc-standard-plugin".

## Misc

["rimraf"](https://github.com/isaacs/rimraf) provides cross-platform `rm -rf` command.

["cross-env"](https://www.npmjs.com/package/cross-env) permits the cross-platform setting of environment variables as part of a command.
