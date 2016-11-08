define(function(require, exports, module) {
	var ExtensionManager = require('core/extensionManager');
	
	var Socket = require('core/socket');
	var Workspace = require('core/workspace');
	var Notification = require('core/notification');
	var Fn = require('core/fn');
	var FileManager = require('core/fileManager');
	
	var Coffee = require('./coffee');
	
	var EditorSession = require('modules/editor/ext/session');
	
	var Extension = ExtensionManager.register({
		name: 'coffee-compiler',
		
	}, {
		init: function() {
			var self = this;
			
			EditorSession.on('save', function(e) {
				if (self._exts.indexOf(e.storage.extension) !== -1) {
					Extension.compile(e.storage.workspaceId, e.storage.path, e.session.data.getValue());
				}
			});
		},
		_exts: ['coffee'],
		importWorkspace: null,
		importPath: '',
		compile: function(workspaceId, path, doc) {
			var self = this;
			var options = FileManager.getFileOptions(doc, /^\s*\#\s*(.+)/);
			
			if (!options.out) {
				return false;
			}
			
			var destination = FileManager.parsePath(path, options.out, [this._exts.join('|'), 'js']);
			
			if (!destination) {
				return false;
			}
			
			this.importWorkspace = workspaceId;
			this.importPath = path;
			
			try {
				var res = Coffee.compile(doc, {
					bare: true,
				});
				
				res = res.trim();
				
				FileManager.saveFile(workspaceId, destination, res, null);
			} catch (e) {
				Notification.open({
					type: 'error',
					title: 'CoffeeScript compilation failed',
					description: e.message + ' on line ' + e.location.first_line,
					autoClose: true
				});
			}
		}
	});

	module.exports = Extension;
});