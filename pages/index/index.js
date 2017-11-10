/* global ko */

require('components/header');
require('components/footer');

var data = require('./data.json');
var viewModel = ko.mapping.fromJS(data);

ko.applyBindings(viewModel);