(function () {
  'use strict';

  describe('Controller: menuCreatorCtrl', function () {

    var menubuilderMocks = window.menubuilderMocks;

    var createController, scope, applicationPageAPI, store, modal, loadRequest, loadRequestCreate, $httpBackend, rootScope, menuFactory;


    beforeEach(module('org.bonitasoft.features.admin.applications.details'));

    beforeEach(inject(function ($controller, $rootScope, $q, $injector) {

      rootScope = $rootScope;
      scope = $rootScope.$new();
      store = {
        load: jasmine.any(Function)
      };
      modal = $injector.get('$modal');
      $httpBackend = $injector.get('$httpBackend');
      applicationPageAPI = $injector.get('applicationPageAPI');
      menuFactory = $injector.get('menuFactory');

      loadRequest = $q.defer();
      loadRequestCreate = $q.defer();

      var promise = loadRequest.promise;

      /**
       * Emulate $http promise for a succes call
       * @param  {Function} cb Callback
       * @return {$q.Promise}
       */
      promise.success = function (cb) {
        promise.then(function () {
          cb(menubuilderMocks.answer);
        });
        return promise;
      };
      /**
       * Emulate $http promise for an error call
       * @param  {Function} cb Callback
       * @return {$q.Promise}
       */
      promise.error = function (cb) {
        promise.then(null, function () {
          cb('Error', 404, {}, {});
        });
        return promise;
      };

      // menuFactory = {
      //   get: function() {
      //     return promise;
      //   },
      //   create: function() {
      //     return promise;
      //   }
      // };
      spyOn(modal, 'open').and.returnValue(window.fakeModal);
      spyOn(menuFactory, 'create').and.returnValue(loadRequestCreate.promise);
      spyOn(menuFactory, 'get').and.returnValue(loadRequest.promise);


      createController = function createController() {
        scope.application = {
          id: 1
        };
        scope.isLabelOnly = true;
        scope.data = {
          currentMenu: null,
          menuItem: [],
          menuItemBuilder: []
        };
        return $controller('menuCreatorCtrl', {
          $scope: scope,
          store: store,
          applicationPageAPI: applicationPageAPI,
          $modal: modal,
          menuFactory: menuFactory
        });
      };

    }));

    it('should create a new controller', function () {
      var Ctrl = createController();
      expect(Ctrl).toBeDefined();
    });

    it('should trigger the loadMenu', function () {
      createController();
      expect(menuFactory.get).toHaveBeenCalled();
      expect(menuFactory.get).toHaveBeenCalledWith(+scope.application.id);
    });

    it('should trigger the loadMenu and associate data', function () {
      spyOn(console, 'debug');
      createController();
      loadRequest.resolve([{
        id: 2
      }]);
      scope.$apply();
      expect(console.debug).toHaveBeenCalled();
    });


    it('should trigger the loadMenu and throw error if so', function () {
      spyOn(console, 'error');
      createController();
      loadRequest.reject(new Error('no data'));
      scope.$apply();
      expect(console.error).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('[menuCreatorCtrl@errorCb] no data');
    });

    it('should trigger the loadMenu on event page-list:update', function () {
      var Ctrl = createController();

      spyOn(Ctrl, 'loadMenu');

      rootScope.$emit('page-list:update');
      scope.$apply();
      expect(Ctrl.loadMenu).toHaveBeenCalled();
    });

    it('should change the value of hasPages when we listen to page-list:pagesexist', function () {
      createController();

      expect(scope.hasPages).toBeUndefined();

      rootScope.$emit('page-list:pagesexist', true);
      scope.$apply();
      expect(scope.hasPages).toBeTruthy();

      rootScope.$emit('page-list:pagesexist', false);
      scope.$apply();
      expect(scope.hasPages).toBeFalsy();
    });

    describe('scenario: we will add something', function () {

      it('should open the modal', function () {
        var Ctrl = createController();
        Ctrl.add();
        expect(Ctrl.modal).toBeDefined();
        expect(modal.open).toHaveBeenCalled();
        expect(modal.open).toHaveBeenCalledWith(menubuilderMocks.mockModalDirective);
      });

      it('should create a new menuItem when we close da modal', function () {
        var Ctrl = createController();
        Ctrl.add();
        Ctrl.modal.close({
          name: 'tobi',
          page: {}
        });

        expect(menuFactory.create).toHaveBeenCalled();
        expect(menuFactory.create).toHaveBeenCalledWith({
          displayName: 'tobi',
          applicationId: 1,
          applicationPageId: '-1',
          children: []
        });
      });

      it('should create a new menuItem  with a pagewhen we close da modal', function () {
        var Ctrl = createController();
        Ctrl.add();
        Ctrl.modal.close({
          name: 'tobi',
          page: {
            id: 150
          }
        });

        expect(menuFactory.create).toHaveBeenCalled();
        expect(menuFactory.create).toHaveBeenCalledWith({
          displayName: 'tobi',
          applicationId: 1,
          applicationPageId: 150
        });
      });

      it('should create a new menuItem  and add it to the scope', function () {
        var Ctrl = createController();
        Ctrl.add();
        Ctrl.modal.close({
          name: 'tobi',
          page: {
            id: 150
          }
        });

        loadRequestCreate.resolve({
          formatted: {
            id: 1,
            name: 'test'
          }
        });
        scope.$apply();
        expect(scope.data.menuItemBuilder.length).toBe(1);

      });

    });
  });
})();
