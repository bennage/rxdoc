var fs = require('fs');
var path = require('path');
var config = require('config');
var esprima = require('esprima');
var walker = require('walkes');
var render = require('./lib/render');

var namespace = config.namespace;
var filePaths = config.files;
var docCommentFlag = config.docCommentFlag;

// used to match named sections in a flagged
// comment, assumes #### NameOfSection on a 
// single line
var patternParameter = /\B#### (.+?)\b/i;

processNextFile([]);

function processNextFile(manifest) {

	if (filePaths.length === 0) {
		render(manifest);
		console.log('all file processed');
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
		processNextFile(manifest.concat(result));
	});
}

filePaths.forEach(function(filePath) {


});


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

function getPropertyValue(expression) {
	return expression.property.type === 'Literal' ? expression.property.value : expression.property.name;
}

function DetermineName(name) {
	var protoIndex = name.indexOf('Proto');

	if (protoIndex > 1) {
		name = name.substr(0, 1).toUpperCase() + name.substr(1, protoIndex - 1);
	}

	return name;
}

function DetermineType(name) {
	var protoIndex = name.indexOf('Proto');

	return (protoIndex > 1) ? 'instance' : 'static';
}

function DetermineAnchor(model) {
	return model.module + '-' + model.type + '-' + model.names[0];
}

function AssignmentExpression(ast, model) {
	var left = ast.left;
	var right = ast.right;
	model.module = DetermineName(left.object.name);
	model.type = DetermineType(left.object.name);
	model.names.push(getPropertyValue(left));

	model.anchor = DetermineAnchor(model);

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

	var lines = raw.value.split('\n');

	// we assume that the body of the documentation
	// is the first thing in the flagged comment
	var property = 'body';
	result[property] = '';

	lines.forEach(function(line) {

		// ignore the line that flags that this 
		// comment is for documentation
		if (line === docCommentFlag) return;

		line = line.trim();

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