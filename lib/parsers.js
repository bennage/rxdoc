var prototypeSuffix = 'Proto';

function getPropertyValue(expression) {
	return expression.property.type === 'Literal' ? expression.property.value : expression.property.name;
}

function DetermineName(name) {
	var protoIndex = name.indexOf(prototypeSuffix);

	if (protoIndex > 1) {
		name = name.substr(0, 1).toUpperCase() + name.substr(1, protoIndex - 1);
	}

	return name;
}

function DetermineType(name) {
	var protoIndex = name.indexOf(prototypeSuffix);

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

module.exports = {
	ExpressionStatement: function(ast, model) {
		return AssignmentExpression(ast.expression, model);
	},
	VariableDeclaration: function(ast, model) {
		return AssignmentExpression(ast.declarations[0].init, model);
	}
};