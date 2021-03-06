(function() {
  'use strict';

  function mockModal(ctrl, view, size) {

    var modal = {
      templateUrl: 'features/admin/applications/' + view + '-application.html',
      controller: ctrl + 'ApplicationCtrl',
      controllerAs: ctrl + 'ApplicationCtrl',
      size: size || 'sm',
      resolve: {
        application: jasmine.any(Function)
      }
    };

    if('import' === ctrl) {
      delete modal.size;
    }
    return modal;
  }

  /**
   * Mock for the $modal from ui.bootstrap
   * {@link http://stackoverflow.com/questions/21214868/angularjs-ui-bootstrap-mocking-modal-in-unit-test}
   * @type {Object}
   */
  var fakeModal = {
    result: {
      then: function(confirmCallback, cancelCallback) {
        //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
        this.confirmCallBack = confirmCallback || angular.noop;
        this.cancelCallback = cancelCallback || angular.noop;
      }
    },
    close: function(item) {
      //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
      this.result.confirmCallBack(item);
    },
    dismiss: function(type) {
      //The user clicked cancel on the modal dialog, call the stored cancel callback
      this.result.cancelCallback(type);
    }
  };

  describe('Load the module application-list', function() {

    var templateCache, httpBackend;

    var prefixUrl = 'features/admin/applications/details/',
        templateUrl = prefixUrl + 'popverunsafe.html',
        templateBtnDetails = prefixUrl + 'application-details-app.html';

    beforeEach(module('org.bonitasoft.features.admin.applications.list'));
    beforeEach(module('main/' + templateUrl));
    beforeEach(module('main/' + templateBtnDetails));


    beforeEach(inject(function ($templateCache, $httpBackend) {

      var template = $templateCache.get('main/' + templateUrl);
      var templateBtnDetailsTpl = $templateCache.get('main/' + templateBtnDetails);

      templateCache = $templateCache;
      httpBackend = $httpBackend;

      $templateCache.put(templateUrl,template);
      $templateCache.put(templateBtnDetails,templateBtnDetailsTpl);

      httpBackend
        .whenGET(templateUrl)
        .respond(200,template);

      httpBackend
        .whenGET(templateBtnDetails)
        .respond(200,'<div></div>');
    }));


    describe('Controller: applicationsListCtrl', function() {

      var scope, applicationAPI, createCtrl, modal, store, loadRequest;

      beforeEach(inject(function($controller, $rootScope, $injector, $q) {
        loadRequest = $q.defer();
        scope = $rootScope.$new();
        applicationAPI = $injector.get('applicationAPI');
        store = $injector.get('store');
        modal = $injector.get('$modal');

        createCtrl = function() {
          return $controller('applicationsListCtrl', {
            '$scope': scope,
            'applicationAPI': applicationAPI,
            'store': store,
            '$modal': modal
          });
        };
        spyOn(store, 'load').and.returnValue(loadRequest.promise);
        spyOn(modal, 'open').and.returnValue(fakeModal);
      }));


      it('should load applications first', function() {
        var dataset = [{
          id: 1
        }, {
          id: 2
        }];

        createCtrl();
        loadRequest.resolve(dataset);
        scope.$apply();

        expect(JSON.stringify(scope.applications)).toBe(JSON.stringify(dataset));
        expect(scope.noData).toBe(false);
      });

      it('should set noData flag if no data have been found', function() {
        var dataset = [];

        createCtrl();
        loadRequest.resolve(dataset);
        scope.$apply();

        expect(scope.noData).toBe(true);
      });

      describe('When we will create something', function() {

        it('should open da modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.create('sm');
          expect(modal.open).toHaveBeenCalled();
          expect(modal.open).toHaveBeenCalledWith(mockModal('add', 'edit'));
        });

        it('should reload the data when we close the modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.create('sm');

          Ctrl.modalCreate.close();

          expect(store.load).toHaveBeenCalled();
        });

      });

      describe('When we will Import something', function() {

        it('should open da modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.importApp('sm');
          expect(modal.open).toHaveBeenCalled();
          expect(modal.open).toHaveBeenCalledWith(mockModal('import', 'import'));
        });

        it('should reload the data when we close the modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.importApp('sm');

          Ctrl.modalImport.close();
          expect(store.load).toHaveBeenCalled();
        });

      });

      describe('Url management', function() {
        var manageTopUrl;

        beforeEach(inject(function ($injector) {
          manageTopUrl = $injector.get('manageTopUrl');
          spyOn(manageTopUrl,'addOrReplaceParam');
        }));

        it('should call addOrReplaceParam when we trigger goToDetails', function() {
          var Ctrl = createCtrl();
          Ctrl.goToDetails(1);
          expect(manageTopUrl.addOrReplaceParam).toHaveBeenCalled();
          expect(manageTopUrl.addOrReplaceParam).toHaveBeenCalledWith('_id',1);
        });

      });

      describe('When we will Export something', function() {

        it('should open da modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.exportApplication('md');
          expect(modal.open).toHaveBeenCalled();
          expect(modal.open).toHaveBeenCalledWith(mockModal('export', 'export', 'md'));
        });

        it('should reload the data when we close the modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.exportApplication('md');

          Ctrl.modalExport.close();
          expect(store.load).toHaveBeenCalled();
        });

      });

      describe('When we will delete something', function() {

        it('should open da modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.deleteApplication(null, 'sm');
          expect(modal.open).toHaveBeenCalled();
          expect(modal.open).toHaveBeenCalledWith(mockModal('delete', 'delete'));
        });

        it('should reload the data when we close the modal', function() {
          var Ctrl = createCtrl();
          scope.$apply();
          Ctrl.deleteApplication(null, 'sm');

          Ctrl.modalDelete.close();

          expect(store.load).toHaveBeenCalled();
        });

      });


    });

    describe('exportApplicationCtrl', function() {

      var controller, modalInstance, applicationAPI, loadRequest, createCtrl, scope;

      beforeEach(inject(function($injector, $q, $rootScope) {

        controller = $injector.get('$controller');
        modalInstance = angular.copy(fakeModal);
        applicationAPI = $injector.get('applicationAPI');
        scope = $rootScope.$new();
        loadRequest = $q.defer();

        //@TODO wait for export method
        // spyOn(applicationAPI,'export').and.returnValue({
        //     $promise: loadRequest
        // });

        spyOn(modalInstance, 'dismiss');
        spyOn(modalInstance, 'close');

        createCtrl = function() {
          scope.application = {
            id: 1337
          };
          return controller('exportApplicationCtrl', {
            '$scope': scope,
            'applicationAPI': applicationAPI,
            '$modalInstance': modalInstance,
            'application': {
              id: 1337
            }
          });
        };

      }));

      it('should close the modal when we trigger cancel', function() {
        var Ctrl = createCtrl();
        Ctrl.cancel();

        expect(modalInstance.dismiss).toHaveBeenCalled();
        expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
      });


      it('should try to export an app', function() {
        // var Ctrl = createCtrl();
        // Ctrl.exportApp();

        //@TODO wait for expect method
        // expect(applicationAPI.export).toHaveBeenCalled();
        // expect(applicationAPI.export).toHaveBeenCalledWith({id: 1337});
      });

      it('should try to export an app and close da modal', function() {
        // var Ctrl = createCtrl();
        // Ctrl.exportApp();

        //@TODO wait for expect method
        // loadRequest.resolve();
        // expect(modalInstance.close).toHaveBeenCalled();
      });
    });

    describe('importApplicationCtrl', function() {

      var controller, modalInstance, importApplication, loadRequest, createCtrl, scope, FileUploader;

      beforeEach(inject(function ($injector, $q, $rootScope) {

        controller        = $injector.get('$controller');
        FileUploader      = $injector.get('FileUploader');
        modalInstance     = angular.copy(fakeModal);
        importApplication = $injector.get('importApplication');
        scope             = $rootScope.$new();
        loadRequest       = $q.defer();

        spyOn(importApplication,'save').and.returnValue({
          $promise: loadRequest.promise
        });

        spyOn(modalInstance, 'dismiss');
        spyOn(modalInstance, 'close');

        createCtrl = function() {
          scope.application = {
            id: 1337
          };
          return controller('importApplicationCtrl', {
            '$scope'            : scope,
            'importApplication' : importApplication,
            'FileUploader'      : FileUploader,
            '$modalInstance'    : modalInstance,
            'application'       : {
              id: 1337
            }
          });
        };

      }));

      it('should have an uploader', function() {
        createCtrl();
        expect(scope.uploader).toBeDefined();
      });

      it('should close the modal when we trigger cancel', function() {
        var Ctrl = createCtrl();
        Ctrl.cancel();

        expect(modalInstance.dismiss).toHaveBeenCalled();
        expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
      });


      describe('Success upload', function() {

        it('should not break if fileItem is undefined', function() {
          var Ctrl = createCtrl();
          Ctrl.successUpload();
          expect(scope.fileName).toBeUndefined();
        });


        it('should et isUploadSuccess to true', function() {
          expect(scope.isUploadSuccess).toBeUndefined();
          var Ctrl = createCtrl();
          Ctrl.successUpload({file: {name: 'toto'}});
          expect(scope.isUploadSuccess).toBeTruthy();
        });

        it('should et get the fileName', function() {
          expect(scope.fileName).toBeUndefined();
          var Ctrl = createCtrl();
          Ctrl.successUpload({file: {name: 'toto'}});
          expect(scope.fileName).toBe('toto');
        });

        it('should et get the filePath', function() {
          expect(scope.filePath).toBeUndefined();
          var Ctrl = createCtrl();
          Ctrl.successUpload({file: {name: 'toto'}}, 'hean-pierrot.xml');
          expect(scope.filePath).toBe('hean-pierrot.xml');
        });

      });

      it('should throw an Error with errorUpload', function() {
        var Ctrl = createCtrl();

        expect(function() {
          Ctrl.errorUpload();
        }).toThrow();
        expect(function() {
          Ctrl.errorUpload();
        }).toThrowError('Cannot upload the file');
      });

      describe('Import an application', function() {

        var Ctrl;
        beforeEach(function() {
          console.debug = angular.noop;
          Ctrl = createCtrl();
          scope.filePath = 'toto.xml';
        });

        it('should call importApplication', function() {
          Ctrl.importApp();
          expect(importApplication.save).toHaveBeenCalled();
          expect(importApplication.save).toHaveBeenCalledWith({
            importPolicy: 'FAIL_ON_DUPLICATES',
            applicationsDataUpload: 'toto.xml'
          });
        });

        it('should set importIsSuccessfull to true', function() {
          Ctrl.importApp();
          loadRequest.resolve({imported: []});
          scope.$apply();
          expect(scope.importIsSuccessfull).toBeTruthy();
        });

        it('should set totalImportedApps to how many import do we have', function() {
          Ctrl.importApp();
          loadRequest.resolve({imported: []});
          scope.$apply();
          expect(scope.totalImportedApps).toBe(0);
        });

        it('should set totalImportedApps to how many import do we have -2', function() {
          Ctrl.importApp();
          loadRequest.resolve({imported: [{},{}]});
          scope.$apply();
          expect(scope.totalImportedApps).toBe(2);
        });

        it('should bind imports', function() {
          Ctrl.importApp();
          loadRequest.resolve({imported: [{name:'tolo'}]});
          scope.$apply();
          expect(scope.imports.length).toBe(1);
          expect(scope.imports[0].name).toBe('tolo');
        });

        it('should bind importNotSuccessfull to true if an error', function() {
          Ctrl.importApp();
          loadRequest.reject({data:{message: 'Ein error'}});
          scope.$apply();
          expect(scope.importNotSuccessfull).toBeTruthy();
        });

        it('should bind the message from the error', function() {
          Ctrl.importApp();
          loadRequest.reject({data:{message: 'Ein error'}});
          scope.$apply();
          expect(scope.messageError).toBe('Ein error');
        });

      });

      it('should trigger the close method of the modalInstance on success', function() {
        var Ctrl = createCtrl();
        Ctrl.closeModalSuccess();
        expect(modalInstance.close).toHaveBeenCalled();
      });


    });

    describe('Service templateAppDetailLoader', function() {

      var http,loadRequestService,rootScope,templateAppDetailLoader,templateCache, interpolate;

      beforeEach(inject(function ($injector, $q) {

        http                    = $injector.get('$http');
        rootScope               = $injector.get('$rootScope');
        interpolate             = $injector.get('$interpolate');
        templateCache           = $injector.get('$templateCache');
        templateAppDetailLoader = $injector.get('templateAppDetailLoader');

        loadRequestService = $q.defer();

        spyOn(http,'get').and.returnValue(loadRequestService.promise);
        spyOn(templateCache,'put');
      }));

      it('should have a noop for compile if no template available', function() {
        expect(templateAppDetailLoader.compile).toBe(angular.noop);
      });

      it('should load the template', function() {
        templateAppDetailLoader.load();
        expect(http.get).toHaveBeenCalled();
        expect(http.get).toHaveBeenCalledWith(templateBtnDetails);
      });

      it('should fill the templateCache', function() {
        templateAppDetailLoader.load();
        loadRequestService.resolve({data: '<div>{{name}}</div>'});
        rootScope.$apply();
        expect(templateCache.put).toHaveBeenCalled();
        expect(templateCache.put).toHaveBeenCalledWith(templateBtnDetails, '<div>{{name}}</div>');
      });

      it('should set the $interpolate service with template to service.compile', function() {
        templateAppDetailLoader.load();
        loadRequestService.resolve({data: '<div>{{name}}</div>'});
        rootScope.$apply();
        expect(templateAppDetailLoader.compile).not.toBe(angular.noop);
        expect(templateAppDetailLoader.compile({name: 'toto'})).toBe('<div>toto</div>');
      });

      it('should execute a callback on load if you give one', function() {
        function test(data) {
          expect(data).toBe('<div>{{name}}</div>');
        }
        templateAppDetailLoader.load(test);
        loadRequestService.resolve({data: '<div>{{name}}</div>'});
        rootScope.$apply();
      });
    });


    describe('Directive exportAppButton', function() {

      var $compile,scope,rootScope;

      beforeEach(inject(function ($injector, $rootScope) {

        $compile  = $injector.get('$compile');
        rootScope = $rootScope;
        scope     = $rootScope.$new();

      }));

      it('should have a transclusion activated ', function() {
        var dom = $compile('<export-app-button>Export your application</export-app-button>')(scope);
        scope.$apply();
        expect(dom.html().indexOf('Export your application') > -1).toBeTruthy();
      });

      it('should a replace activated', function() {
        var dom = $compile('<export-app-button>Export your application</export-app-button>')(scope);
        scope.$apply();
        expect(dom.html().indexOf('export-app-button') > -1).toBeFalsy();
      });

      describe('With an attribute title', function() {

        it('should have a title if we give one, empty for no value set - undefined', function() {

          scope.name = undefined;
          var dom = $compile('<export-app-button title="{{name}}">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('title') === '').toBeTruthy();
        });

        it('should have a title if we give one, empty for no value set - null', function() {

          scope.name = null;
          var dom = $compile('<export-app-button title="{{name}}">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('title') === '').toBeTruthy();
        });

        it('should have a title if we give one, fill for a value set', function() {

          scope.name = 'test';
          var dom = $compile('<export-app-button title="{{name}}">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('title') === 'test').toBeTruthy();
        });

        it('should have a title if we give one, fill for a value set', function() {

          scope.name = 42;
          var dom = $compile('<export-app-button title="{{name}}">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('title') === '42').toBeTruthy();
        });

      });

      describe('With an attribute class', function() {

        it('should have a default one set to btn-export', function() {
          var dom = $compile('<export-app-button>Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.hasClass('btn-export')).toBeTruthy();
        });

        it('should have other class if we give it some classNames', function() {
          var dom = $compile('<export-app-button class="btn btn-test">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.hasClass('btn-test')).toBeTruthy();
          expect(dom.hasClass('btn')).toBeTruthy();
        });

        it('should have a default one set to btn-export and other oif specify', function() {
          var dom = $compile('<export-app-button class="btn btn-test">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.hasClass('btn-export')).toBeTruthy();
        });

      });

      describe('Create a download URL', function() {

        it('should have a default url to download', function() {
          var dom = $compile('<export-app-button>Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('href') === '/bonita/portal/exportApplications?id=').toBeTruthy();
        });

        it('should have an id in the url', function() {
          var dom = $compile('<export-app-button app-id="42">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('href') === '/bonita/portal/exportApplications?id=42').toBeTruthy();
        });

        it('should custom the url', function() {
          var dom = $compile('<export-app-button url="/export/" app-id="42">Export your application</export-app-button>')(scope);
          scope.$apply();
          expect(dom.attr('href') === '/export/42').toBeTruthy();
        });

      });

    });


  });



})();
