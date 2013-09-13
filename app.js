var fs = require('fs');
var esprima = require('esprima');
var walker = require('walkes');

var modules = ['Observable'];

// comments that begin with this flag are
// to be used for generating documentation
var docCommentFlag = '*';

// use to convert a string containing \n 
// into an array of strings
var patternLine = /.+/g;

// used to match named sections in a flagged
// comment, assumes #### NameOfSection on a 
// single line
var patternParameter = /\B#### (.+?)\b/i;

fs.readFile('sample.js', 'utf8', function(err, data) {

	if (err) console.log(err);

	var ast = esprima.parse(data, {
		loc: true,
		comment: true
	});

	var flaggedComments = ast.comments
		.filter(function(x) {
			return x.value.indexOf(docCommentFlag) === 0
		});
	debugger;
	var manifest = search(ast, flaggedComments);

	debugger;
});

function search(ast, comments) {
	var result = [];
	var candidate = comments.shift();
	var line = candidate.loc.end.line;

	walker(ast, {
		'default': function(recurse, stop) {

			if (this.loc.start.line === (line + 1)) {
				debugger;
				var comment = parseComment(candidate);
				var doc = buildDoc(this, comment);
				result.push(doc);

				if (comments.length === 0) stop();

				candidate = comments.shift();
				line = candidate.loc.end.line;
			}

			walker.checkProps.call(this, recurse);
		}
	});

	return result;
}

var parsers = {
	ExpressionStatement: function(ast, model) {
		var left = ast.expression.left;
		// var right = ast.expression.right;

		model.names.push(left.property.name);
		model.module = left.object.name;

		return model;
	},
	VariableDeclaration: function(ast, model) {
		return model;
	}
};

function parseComment(raw) {

	var result = {};
	var lines = raw.value.match(patternLine);

	// we assume that the body of the documentation
	// is the first thing in the flagged comment
	var property = 'body';
	result[property] = '';

	lines.forEach(function(line) {

		// ignore the line that flags that this 
		// comment is for documentation
		if (line === docCommentFlag) return;

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

function buildDoc(ast, comment) {

	var loc = ast.loc;
	var parser = parsers[ast.type];
	if (!parser) throw new Error('How do I shot ' + ast.type + '?');

	var model = parser(ast, {
		names: [],
		module: '',
		comment: comment,
		lines: {
			start: loc.start.line,
			end: loc.end.line
		}
	});

	debugger;

	return model;
	// return {
	// 	file: 'observable.md',
	// 	section: 'static', // 'instance',
	// 	shortName: left.property.name,
	// 	fullName: left.object.name + '.' + left.property.name,
	// 	lines: {
	// 		start: loc.start.line,
	// 		end: loc.end.line
	// 	},
	// 	comment: comment
	// };

}