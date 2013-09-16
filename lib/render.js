var fs = require('fs');
var config = require('config');
var _ = require('lodash');

var namespace = config.namespace,
	rootSourceUrl = config.rootSourceUrl;

var template_page =
	'#${module} object\n\n' +
	'${body}\n' +
	'## `${module} Methods`\n' +
	'${staticTOC}\n' +
	'## `${module} Instance Methods`\n' +
	'${instanceTOC}\n' +
	'## _${module} Methods_ ##\n' +
	'${staticContent}\n' +
	'## _${module} Instance Methods_ ##\n' +
	'${intanceContent}\n';

var template_toc_item =
	'- [`${aliases}`](#${anchor})' + '\n';

var template_item =
	'### <a id="${anchor}"></a>`${signature}`\n' +
	'[&#x24C8;](${sourceUrl} "View in source")\n\n' +
	'${body}\n\n' +
	'#### Arguments\n' +
	'${arguments}\n\n' +
	'#### Returns\n' +
	'${returns}\n\n' +
	'#### Example\n' +
	'```js\n' +
	'${example}\n' +
	'```\n\n' +
	'### Location\n' +
	'- ${file}\n' +
	'* * *';

function render(manifest) {

	var pages = manifest
		.filter(function(item) {
			return item.module === namespace;
		})
		.map(function(item) {
			var set = manifest
				.filter(function(sub) {
					return sub.module === item.names[0];
				});
			return {
				meta: item,
				content: renderModule(item, set, namespace)
			};
		});

	return pages;
}

function renderTocItem(accum, current) {
	return accum + _.template(template_toc_item, {
		aliases: current.names.join(' | '),
		anchor: current.anchor
	});
}

function renderItem(accum, item) {
	debugger;
	return accum + _.template(template_item, {
		anchor: item.anchor,
		signature: namespace + '.' + item.module + '.' + item.names[0],
		sourceUrl: rootSourceUrl + item.file + '#L' + item.lines.start + '-L' + item.lines.end,
		body: item.comment.body,
		arguments: item.comment.arguments,
		returns: item.comment.returns,
		example: item.comment.example,
		file: item.file
	});
}

function renderModule(header, set, namespace) {

	var staticMembers = set
		.filter(function(item) {
			return item.type === 'static';
		});

	var instanceMembers = set
		.filter(function(item) {
			return item.type === 'instance';
		});

	var staticTOC = staticMembers.reduce(renderTocItem, '');
	var instanceTOC = instanceMembers.reduce(renderTocItem, '');

	var staticContent = staticMembers.reduce(renderItem, '');
	var intanceContent = 'instance members';

	return _.template(template_page, {
		module: header.names[0],
		body: header.comment.body,
		staticTOC: staticTOC,
		instanceTOC: instanceTOC,
		staticContent: staticContent,
		intanceContent: intanceContent
	});
}

module.exports = render;