/* global ko */

var data = require('./data.json');
var template = require('./template.html');

function createViewModel(params) {
    var viewModel = ko.mapping.fromJS(data);

    return viewModel;
}

ko.components.register('header', {
    viewModel: {
        createViewModel: createViewModel
    },
    template: template
});
