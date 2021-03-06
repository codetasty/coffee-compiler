/* global define, $ */
"use strict";

define(function(require, exports, module) {
	const ExtensionManager = require('core/extensionManager');
	
	const Utils = require('core/utils');
	const FileManager = require('core/fileManager');
	
	const EditorSession = require('modules/editor/ext/session');
	const EditorCompiler = require('modules/editor/ext/compiler');
	
	class Extension extends ExtensionManager.Extension {
		constructor() {
			super({
				name: 'coffee-compiler',
			});
			
			this.worker = null;
			this.watcher = null;
			
			this.compilerName = 'CoffeeScript';
		}
		
		init() {
			super.init();
			
			var self = this;
			
			this.worker = new Worker(this.getBaseUrl() + '/worker.js?rev=' + this.version);
			
			this.worker.onmessage = function(e) {
				self.onWorker(e.data);
			};
			
			this.watcher = EditorCompiler.addWatcher(this.name, {
				property: 'source',
				extensions: ['coffee'],
				outputExtension: 'js',
				comments: true,
				commentRegex: /^\s*\#\s*(.+)/,
				watch: this.onWatch.bind(this),
			});
		}
		
		destroy() {
			super.destroy();
			
			this.worker.terminate();
			this.worker = null;
			
			this.watcher = null;
			EditorCompiler.removeWatcher(this.name);
		}
		
		onWatch(workspaceId, obj, session, value) {
			EditorCompiler.addCompiler(this.watcher, this.compilerName, workspaceId, obj, function(compiler) {
				this.worker.postMessage({
					action: 'compile',
					id: compiler.id,
					source: compiler.source
				});
				
				compiler.file = this.onFile.bind(this);
			}.bind(this));
		}
		
		onFile(compiler, path, file) {
			if (!this.worker) {
				return EditorCompiler.removeCompiler(compiler);
			}
			
			this.worker.postMessage({
				action: 'file',
				id: compiler.id,
				path: path,
				file: file
			});
		}
		
		onWorker(data) {
			var compiler = EditorCompiler.getCompiler(data.id);
			
			if (!compiler) {
				return;
			}
			
			switch (data.action) {
				case 'output':
					EditorCompiler.saveOutput(compiler, data.data);
				break;
				
				case 'error':
					compiler.destroy(new Error(
							'%s on <strong>%s:%s</strong> in file <strong>%s</strong>.'.sprintfEscape(data.error.message, data.error.line+1, data.error.column+1, data.path)
					));
					EditorCompiler.removeCompiler(compiler);
				break;
			}
		}
	}

	module.exports = new Extension();
});