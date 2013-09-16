var fs = require('fs');
var _ = require('lodash');

var namespace = 'Rx';

var template_header =
	'#${module} object\n\n' +
	'${body}\n' +
	'## `${module} Methods`\n' +
	'${staticTOC}\n' +
	'## `${module} Instance Methods`\n' +
	'${instanceTOC}\n';

var template_toc_item =
	'- [`${method}`](#${method})' + '\n';

function render(manifest) {
	var output = '';

	var header = manifest.filter(function(item) {
		return item.module === namespace;
	})[0];

	var pages = manifest
		.filter(function(item) {
			return item.module === namespace;
		})
		.map(function(item) {
			var set = manifest
				.filter(function(sub) {
					return sub.module === item.names[0];
				});
			return renderModule(item, set, namespace);
		});

	return pages;
}

function renderModule(header, set, namespace) {
	debugger;

	var staticTOC = set
		.filter(function(item) {
			return item.type === 'static';
		})
		.reduce(function(accum, current) {
			return accum + _.template(template_toc_item, {
				method: current.names[0]
			});
		}, '');

	var instanceTOC = set
		.filter(function(item) {
			return item.type === 'instance';
		})
		.reduce(function(accum, current) {
			return accum + _.template(template_toc_item, {
				method: current.names[0]
			});
		}, '');

	return _.template(template_header, {
		module: header.names[0],
		body: header.comment.body,
		staticTOC: staticTOC,
		instanceTOC: instanceTOC
	});
}

module.exports = render;