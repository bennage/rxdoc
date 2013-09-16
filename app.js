var fs = require('fs');
var path = require('path');
var config = require('config');
var esprima = require('esprima');
var walker = require('walkes');
var render = require('./lib/render');
var parsers = require('./lib/parsers');

var namespace = config.namespace,
	filePaths = config.files,
	docCommentFlag = config.docCommentFlag,
	outputDir = config.outputDir;

// used to match named sections in a flagged
// comment, assumes @NameOfSection on a 
// single line
var patternParameter = /\B@(.+?)\b/i;

processSourceFile([]);

function processSourceFile(manifest) {

	if (filePaths.length === 0) {
		var pages = render(manifest);
		writeDocumentationFiles(pages);
		return;
	}

	var filePath = filePaths.pop();

	fs.readFile(filePath, 'utf8', function(err, data) {

		if (err) console.log(err);

		var ast = esprima.parse(data, {
			loc: true,
			comment: true
		});

		var flaggedComments = ast.comments
			.filter(function(x) {
				return x.value.indexOf(docCommentFlag) === 0
			});

		var result = scan(ast, flaggedComments, path.basename(filePath));
		processSourceFile(manifest.concat(result));
	});
}

function writeDocumentationFiles(pages) {

	function writeFiles() {
		pages.forEach(function(page) {
			var filename = page.meta.names[0].toLowerCase() + '.md';
			var filePath = path.join(outputDir, filename);
			fs.writeFile(filePath, page.content, function(err) {
				if (err) throw err;
			});
		});
	}

	fs.exists(outputDir, function(exists) {
		if (exists) {
			writeFiles();
		} else {
			fs.mkdir(outputDir, function(err) {
				if (err) throw err;
				writeFiles();
			});
		}
	});

}

function scan(ast, comments, sourceFile) {
	var items = [];
	var candidate = comments.shift();
	var line = candidate.loc.end.line;

	walker(ast, {
		'default': function(recurse, stop) {

			if (this.loc.start.line === (line + 1)) {
				var comment = parseComment(candidate);
				var item = buildDoc(this, comment, sourceFile);
				items.push(item);

				if (comments.length === 0) stop();

				candidate = comments.shift();
				line = candidate.loc.end.line;
			}

			walker.checkProps.call(this, recurse);
		}
	});

	return items;
}

function parseComment(raw) {

	var result = {};

	var lines = raw.value.split('\n');

	// we assume that the body of the documentation
	// is the first thing in the flagged comment
	var property = 'body';
	result[property] = '';

	lines.forEach(function(line) {

		// ignore the line that flags that this 
		// comment is for documentation
		if (line === docCommentFlag) return;

		if (property !== 'example') line = line.trim();

		var match = patternParameter.exec(line);
		if (match === null) {
			result[property] += line + '\n';
		} else {
			property = match[1].toLowerCase();
			result[property] = '';
		}
	});

	return result;
}

function buildDoc(ast, comment, sourceFile) {

	var loc = ast.loc;
	var parser = parsers[ast.type];
	if (!parser) throw new Error('How do I shot ' + ast.type + '?');

	var model = parser(ast, {
		names: [],
		module: '',
		type: 'static',
		comment: comment,
		file: sourceFile,
		lines: {
			start: loc.start.line,
			end: loc.end.line
		}
	});

	return model;
}