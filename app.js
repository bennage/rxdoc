var fs = require('fs');
var esprima = require('esprima');
var walker = require('walkes');

var modules = ['Observable'];

// comments that begin with this flag are
// to be used for generating documentation
var docCommentFlag = '@';

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

	var manifest = scan(ast, flaggedComments);
});

function scan(ast, comments) {
	var result = [];
	var candidate = comments.shift();
	var line = candidate.loc.end.line;

	walker(ast, {
		'default': function(recurse, stop) {

			if (this.loc.start.line === (line + 1)) {
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

function getPropertyValue(expression) {
	return expression.property.type === 'Literal' ? expression.property.value : expression.property.name;
}

function AssignmentExpression(ast, model) {
	var left = ast.left;
	var right = ast.right;

	model.module = left.object.name;
	model.names.push(getPropertyValue(left));

	if (right.type === 'AssignmentExpression') {
		AssignmentExpression(right, model);
	}

	if (right.type === 'FunctionExpression') {
		FunctionExpression(right, model);
	}

	return model;
}

function FunctionExpression(ast, model) {
	model.parameters = ast.params.map(function(p) {
		return p.name;
	});
	return model;
}

var parsers = {
	ExpressionStatement: function(ast, model) {
		return AssignmentExpression(ast.expression, model);
	},
	VariableDeclaration: function(ast, model) {
		return AssignmentExpression(ast.declarations[0].init, model);
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

	return model;
}