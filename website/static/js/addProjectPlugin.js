/**
 * UI and function to add project
 */
'use strict';

var $ = require('jquery');
var m = require('mithril');
var $osf = require('js/osfHelpers');

// XHR configuration to get apiserver connection to work
var xhrconfig = function (xhr) {
    xhr.withCredentials = true;
};


var AddProject = {
    controller : function (options) {
        var self = this;
        self.defaults = {
            buttonTemplate : m('.btn.btn-primary[data-toggle="modal"][data-target="#addProjectModal"]', 'Add new Project'),
            parent : null
        };
        self.viewState = m.prop('form'); // 'processing', 'success', 'error';
        self.options = $.extend(self.defaults, options);
        self.init = function _init () {

        };
        self.newProjectName = m.prop('');
        self.goToProjectLink = m.prop('');
        self.add = function _add () {
            self.viewState('processing');
            var url = $osf.apiV2Url('nodes/', { query : {}});
            var data = {
                    'data' : {
                        'type': 'nodes',
                        'attributes': {
                            'title': self.newProjectName(),
                            'category': 'project'
                        }
                    }
                };
            var success = function _success (result) {
                self.viewState('success');
                console.log('success', result);
                self.goToProjectLink(result.data.links.html);
            };
            var error = function _error (result) {
                self.viewState('error');
                console.log('error', result);

            };
            m.request({method : 'POST', url : url, data : data, config : xhrconfig})
                .then(success, error);

            //Method:        POST
            //URL:           links.self
            //Query Params:  <none>
            //Body (JSON):   {
            //    "data": {
            //        "type": "nodes", # required
            //        "attributes": {
            //            "title":       {title},          # required
            //            "category":    {category},       # required
            //            "description": {description},    # optional
            //            "tags":        [{tag1}, {tag2}], # optional
            //            "public":      true|false        # optional
            //        }
            //    }
            //}
            //Success:       201 CREATED + node representation

        };
    },
    view : function (ctrl, options) {
        var templates = {
            form : m('.modal-content', [
                m('.modal-header', [
                    m('button.close[data-dismiss="modal"][aria-label="Close"]', [
                        m('span[aria-hidden="true"]','×'),
                    ]),
                    m('h3.modal-title#addProject', 'Add New Project')
                ]),
                m('.modal-body', [
                    m('.form-inline', [
                        m('.form-group', [
                            m('label[for="addCollInput]', 'Project Name'),
                            m('input[type="text"].form-control.m-l-sm#addCollInput', {onchange: m.withAttr('value', ctrl.newProjectName), value: ctrl.newProjectName()})
                        ])
                    ]),
                ]),
                m('.modal-footer', [
                    m('button[type="button"].btn.btn-default[data-dismiss="modal"]', 'Cancel'),
                    m('button[type="button"].btn.btn-success', { onclick : ctrl.add },'Add')
                ])
            ]),
            processing : m('.modal-content',
                m('.modal-content',
                    m('.modal-header', [
                        m('button.close[data-dismiss="modal"][aria-label="Close"]', [
                            m('span[aria-hidden="true"]','×'),
                        ]),
                    ]),
                    m('.modal-body', [
                            m('.add-project-processing', 'Saving your project...')
                        ]
                    )
                )
            ),
            success : m('.modal-content', [
                m('.modal-content',
                    m('.modal-header', [
                        m('button.close[data-dismiss="modal"][aria-label="Close"]', [
                            m('span[aria-hidden="true"]','×'),
                        ]),
                    ]),
                    m('.modal-body', [
                            m('.add-project-success', 'Success...')
                        ]
                    ),
                    m('.modal-footer', [
                        m('button[type="button"].btn.btn-default[data-dismiss="modal"]', 'Keep Working Here'),
                        m('a.btn.btn-success', { href : ctrl.goToProjectLink() },'Go to New Project')
                    ])
                )
            ]),
            error : m('.modal-content', [
                m('.modal-content',
                    m('.modal-header', [
                        m('button.close[data-dismiss="modal"][aria-label="Close"]', [
                            m('span[aria-hidden="true"]','×'),
                        ]),
                    ]),
                    m('.modal-body', [
                            m('.add-project-error', 'There was a problem...')
                        ]
                    )
                )
            ])
        };

        return  m('#addProjectWrap', [
            ctrl.options.buttonTemplate,
            m('#addProjectModal.modal.fade[tabindex=-1][role="dialog"][aria-labelledby="addProject"][aria-hidden="true"]',
                m('.modal-dialog',
                    templates[ctrl.viewState()]
                )
            )
        ]);
    }
};

module.exports = AddProject;