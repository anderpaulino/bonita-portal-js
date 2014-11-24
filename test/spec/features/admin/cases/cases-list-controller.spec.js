/* global cases, describe  */
(function () {
  'use strict';
  describe('admin cases list features', function () {

    var scope, caseAPI, fullCases, promise, q, deferred;

    beforeEach(module('org.bonita.features.admin.cases.list.table'));

    beforeEach(inject(function ($rootScope, $q) {
      //we use the casesListMocks.js in order to init data for the test
      fullCases = {resource: cases};
      fullCases.resource.pagination = {
        total: 4
      };
      q = $q;
      scope = $rootScope.$new();
      deferred = q.defer();
      promise = deferred.promise;
      caseAPI = jasmine.createSpyObj('caseAPI', ['search']);
      caseAPI.search.and.returnValue({$promise : promise});
    }));

    describe('controller initialization', function () {

      var defaultPageSize = 1000;
      var defaultSort = 'id';
      var defaultDeployedFields = ['titi', 'tata', 'toto'];
      var defaultActiveCounterFields = ['failed', 'ongoing'];

      describe('with incorrect columns', function () {
        beforeEach(inject(function ($controller) {
          $controller('ActiveCaseListCtrl', {
            '$scope': scope,
            'caseAPI': caseAPI,
            'defaultPageSize': defaultPageSize,
            'defaultSort': defaultSort,
            'defaultDeployedFields': defaultDeployedFields,
            'defaultActiveCounterFields': defaultActiveCounterFields,
            'casesColumns': [
              {name: 'AppName', sortName: 'name', path: ['processDefinitionId', 'name']},
              {name: 'Version', sortName: 'version', path: ['processDefinitionIdsdf', 'version']},
              {name: 'CaseId', sortName: 'id', path: ['idsdf']}
            ],
            'processId' : undefined,
            'supervisorId' : undefined
          });
        }));
        it('should not display all fields', function () {
          deferred.resolve(fullCases);
          scope.$apply();
          expect(scope.cases).toBeDefined();
          expect(scope.cases.length).toBe(4);
          for (var j = 0; j < scope.cases.length; j++) {
            var singleCase = scope.cases[j];
            expect(singleCase[scope.columns[0].name]).toBeTruthy();
            expect(singleCase[scope.columns[1].name]).toBeFalsy();
            expect(singleCase[scope.columns[2].name]).toBeFalsy();
          }
          expect(caseAPI.search).toHaveBeenCalledWith({
            p: 0,
            c: defaultPageSize,
            o: defaultSort + ' ASC',
            d: defaultDeployedFields,
            f: [],
            n : defaultActiveCounterFields,
            s : undefined
          });
        });
      });

      describe('with correct columns', function () {

        beforeEach(inject(function ($controller) {
          $controller('ActiveCaseListCtrl', {
            '$scope': scope,
            'caseAPI': caseAPI,
            'defaultPageSize': defaultPageSize,
            'defaultSort': defaultSort,
            'defaultDeployedFields': defaultDeployedFields,
            'defaultActiveCounterFields': defaultActiveCounterFields,
            'processId' : undefined,
            'supervisorId' : undefined
          });
        }));

        it('should fill the scope cases', inject(function () {
          deferred.resolve(fullCases);
          scope.$apply();
          expect(scope.cases).toBeDefined();
          expect(scope.cases.length).toBe(4);
          for (var j = 0; j < scope.cases.length; j++) {
            var singleCase = scope.cases[j];
            for (var k = 0; k < scope.cases.length; k++) {
              expect(singleCase[scope.columns[k].name]).toBeTruthy();
            }
          }
          expect(caseAPI.search).toHaveBeenCalledWith({
            p: 0,
            c: defaultPageSize,
            o: defaultSort + ' ASC',
            d: defaultDeployedFields,
            f: [],
            n : defaultActiveCounterFields,
            s : undefined
          });
        }));
      });
      describe('when supervisor', function () {
        describe(' is set', function(){
          beforeEach(inject(function ($controller) {
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              'caseAPI': caseAPI,
              'defaultPageSize': defaultPageSize,
              'defaultSort': defaultSort,
              'defaultDeployedFields': defaultDeployedFields,
              'defaultActiveCounterFields': defaultActiveCounterFields,
              'processId' : undefined,
              'supervisorId' : 1
            });
          }));

          it('should fill ths filters with supervisor_id', inject(function () {
            expect(scope.filters).toEqual(['supervisor_id=1']);
          }));
        });
        describe(' is not set', function(){
          beforeEach(inject(function ($controller) {
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              'caseAPI': caseAPI,
              'defaultPageSize': defaultPageSize,
              'defaultSort': defaultSort,
              'defaultDeployedFields': defaultDeployedFields,
              'defaultActiveCounterFields': defaultActiveCounterFields,
              'processId' : undefined,
              'supervisorId' : undefined
            });
          }));

          it('should not fill ths filters with supervisor_id', inject(function () {
            expect(scope.filters).toEqual([]);
          }));
        });
      });
    });

    describe('sort behaviour', function () {
      describe('go to case details', function () {
        var mockedWindow,
          manageTopUrl = jasmine.createSpyObj('manageTopUrl', ['getUrlToTokenAndId', 'addOrReplaceParam']);
        beforeEach(function(){
          mockedWindow = {
              top : {
                location:{}
              }
            };
        });

        describe('go to case function', function(){
          beforeEach(inject(function($controller){
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              '$window' : mockedWindow,
              'manageTopUrl' : manageTopUrl,
              'moreDetailToken' : 'casemoredetailsadmin',
              'processId' : undefined,
              'supervisorId' : undefined
            });
            manageTopUrl.getUrlToTokenAndId.calls.reset();
          }));
          it('should change top location hash to case detail', function () {
            expect(scope.getCaseDetailUrl()).toBeUndefined();
          });

          it('should change top location hash to case detail', function () {
            manageTopUrl.getUrlToTokenAndId.and.returnValue('/bonita/portal/homepage?tenant=1#?id=123&_p=casemoredetailsadmin&_pf=2');
            var caseItemId = 123;
            expect(scope.getCaseDetailUrl(caseItemId)).toEqual('/bonita/portal/homepage?tenant=1#?id=123&_p=casemoredetailsadmin&_pf=2');
            caseItemId = '4568';
            manageTopUrl.getUrlToTokenAndId.and.returnValue('/bonita/portal/homepage?tenant=1#?id=4568&_p=casemoredetailsadmin&_pf=2');
            scope.getCaseDetailUrl(caseItemId);
            expect(scope.getCaseDetailUrl(caseItemId)).toEqual('/bonita/portal/homepage?tenant=1#?id=4568&_p=casemoredetailsadmin&_pf=2');
            expect(manageTopUrl.getUrlToTokenAndId.calls.allArgs()).toEqual([[123, 'casemoredetailsadmin'], ['4568', 'casemoredetailsadmin'], ['4568', 'casemoredetailsadmin']]);
          });
        });
        describe('go to case function', function(){
          beforeEach(function(){
            manageTopUrl.getUrlToTokenAndId.calls.reset();
          });
          it('should change top location hash to case detail', inject(function($controller){
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              '$window' : mockedWindow,
              'manageTopUrl' : manageTopUrl,
              'moreDetailToken' : 'casemoredetailsadmin',
              'processId' : undefined,
              'supervisorId' : 1
            });
            expect(scope.getCaseDetailUrl()).toBeUndefined();
          }));

          it('should change top location hash to case detail', inject(function($controller){
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              '$window' : mockedWindow,
              'manageTopUrl' : manageTopUrl,
              'moreDetailToken' : 'casemoredetailsadmin',
              'processId' : undefined,
              'supervisorId' : 1
            });
            manageTopUrl.getUrlToTokenAndId.and.returnValue('/bonita/portal/homepage?tenant=1#?id=123&_p=casemoredetailspm&_pf=2');
            var caseItemId = 123;
            expect(scope.getCaseDetailUrl(caseItemId)).toEqual('/bonita/portal/homepage?tenant=1#?id=123&_p=casemoredetailspm&_pf=2');
            caseItemId = '4568';
            manageTopUrl.getUrlToTokenAndId.and.returnValue('/bonita/portal/homepage?tenant=1#?id=4568&_p=casemoredetailspm&_pf=2');
            scope.getCaseDetailUrl(caseItemId);
            expect(scope.getCaseDetailUrl(caseItemId)).toEqual('/bonita/portal/homepage?tenant=1#?id=4568&_p=casemoredetailspm&_pf=2');
            expect(manageTopUrl.getUrlToTokenAndId.calls.allArgs()).toEqual([[123, 'casemoredetailspm'], ['4568', 'casemoredetailspm'], ['4568', 'casemoredetailspm']]);
          }));

          it('should change top location hash to case detail', inject(function($controller){
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              '$window' : mockedWindow,
              'manageTopUrl' : manageTopUrl,
              'moreDetailToken' : 'casemoredetails',
              'processId' : undefined,
              'supervisorId' : 1
            });
            manageTopUrl.getUrlToTokenAndId.and.returnValue('/bonita/portal/homepage?tenant=1#?id=123&_p=casemoredetails&_pf=2');
            var caseItemId = 123;
            expect(scope.getCaseDetailUrl(caseItemId)).toEqual('/bonita/portal/homepage?tenant=1#?id=123&_p=casemoredetails&_pf=2');
            caseItemId = '4568';
            manageTopUrl.getUrlToTokenAndId.and.returnValue('/bonita/portal/homepage?tenant=1#?id=4568&_p=casemoredetails&_pf=2');
            scope.getCaseDetailUrl(caseItemId);
            expect(scope.getCaseDetailUrl(caseItemId)).toEqual('/bonita/portal/homepage?tenant=1#?id=4568&_p=casemoredetails&_pf=2');
            expect(manageTopUrl.getUrlToTokenAndId.calls.allArgs()).toEqual([[123, 'casemoredetails'], ['4568', 'casemoredetails'], ['4568', 'casemoredetails']]);
          }));
        });
      });

      describe('page changes', function () {
        var defaultPageSize = 2;
        var defaultSort = 'id';
        var defaultDeployedFields = ['titi', 'tata', 'toto'];
        var anchorScroll = jasmine.createSpy();
        var defaultActiveCounterFields = ['failed', 'ongoing'];

        beforeEach(inject(function ($controller) {
          $controller('ActiveCaseListCtrl', {
            '$scope': scope,
            'caseAPI': caseAPI,
            'defaultPageSize': defaultPageSize,
            'defaultSort': defaultSort,
            'defaultDeployedFields': defaultDeployedFields,
            'casesColumns': [
              {name: 'AppName', sortName: 'name', path: ['processDefinitionId', 'name']},
              {name: 'Version', sortName: 'version', path: ['processDefinitionId', 'version']},
              {name: 'CaseId', sortName: 'id', path: ['id']}
            ],
            '$anchorScroll': anchorScroll,
            'defaultActiveCounterFields': defaultActiveCounterFields,
            'processId' : undefined,
            'supervisorId' : undefined
          });
        }));
        it('should call next Page without sort', function () {
          deferred.resolve(fullCases);
          scope.$apply();
          expect(scope.currentFirstResultIndex).toBe(1);
          expect(scope.currentLastResultIndex).toBe(2);
          scope.pagination.currentPage++;
          // deferred = q.defer();
          // caseAPI.search.and.returnValue({$promise : deferred.promise.then()});
          // deferred.resolve(fullCases);
          scope.searchForCases();
          scope.$apply();
          expect(scope.currentFirstResultIndex).toBe(3);
          expect(scope.currentLastResultIndex).toBe(4);
          expect(anchorScroll).toHaveBeenCalled();
          expect(caseAPI.search.calls.allArgs()).toEqual([
            [
              {p: 0, c: defaultPageSize, o: defaultSort + ' ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ],
            [
              {p: 1, c: defaultPageSize, o: defaultSort + ' ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ],
          ]);
        });
        it('should call search twice on second page with second call faster than the first, the second result should be displayed', function () {
          scope.$apply();
          scope.pagination.currentPage++;
          var secondDeferred = q.defer();
          caseAPI.search.and.returnValue({$promise : secondDeferred.promise, id:1});
          scope.searchForCases();
          var results = cases.slice(2,4);
          results.pagination = fullCases.resource.pagination;
          secondDeferred.resolve({resource : results});
          scope.$apply();
          results = cases.slice(0,2);
          results.pagination = fullCases.resource.pagination;
          deferred.resolve({resource : results});
          scope.$apply();
          expect(scope.cases[0].id).toBe('2');
          expect(scope.cases[1].id).toBe('4');
          expect(scope.cases.length).toBe(2);
          expect(scope.currentFirstResultIndex).toBe(3);
          expect(scope.currentLastResultIndex).toBe(4);
        });
        it('should call search twice with second call faster than the first, the second result should be displayed', function () {
          scope.$apply();
          var secondDeferred = q.defer();
          caseAPI.search.and.returnValue({$promise : secondDeferred.promise, id:1});
          scope.searchForCases();
          var results = cases.slice(2,4);
          results.pagination = {
            total: 20
          };
          secondDeferred.resolve({resource : results});
          scope.$apply();
          results = cases.slice(0,2);
          results.pagination = {
            total: 6
          };
          deferred.resolve({resource : results});
          scope.$apply();
          expect(scope.cases[0].id).toBe('2');
          expect(scope.cases[1].id).toBe('4');
          expect(scope.cases.length).toBe(2);
          expect(scope.currentFirstResultIndex).toBe(1);
          expect(scope.currentLastResultIndex).toBe(2);
          expect(scope.pagination.total).toBe(20);
        });
        it('should call next Page on current sort', function () {
          deferred.resolve(fullCases);
          scope.$apply();
          scope.searchForCases({property: 'name', ascendant: false});
          expect(scope.currentFirstResultIndex).toBe(1);
          expect(scope.currentLastResultIndex).toBe(2);
          expect(anchorScroll).toHaveBeenCalled();
          scope.pagination.currentPage++;
          scope.searchForCases();
          scope.$apply();
          expect(scope.currentFirstResultIndex).toBe(3);
          expect(scope.currentLastResultIndex).toBe(4);
          expect(anchorScroll).toHaveBeenCalled();
          scope.pagination.currentPage--;
          scope.searchForCases();
          scope.$apply();
          expect(scope.currentFirstResultIndex).toBe(1);
          expect(scope.currentLastResultIndex).toBe(2);
          expect(anchorScroll).toHaveBeenCalled();
          scope.searchForCases({property: 'version', ascendant: true});
          expect(scope.currentFirstResultIndex).toBe(1);
          expect(scope.currentLastResultIndex).toBe(2);
          expect(anchorScroll).toHaveBeenCalled();

          expect(caseAPI.search.calls.allArgs()).toEqual([
            [
              {p: 0, c: defaultPageSize, o: defaultSort + ' ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ],
            [
              {p: 0, c: defaultPageSize, o: 'name DESC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ],
            [
              {p: 1, c: defaultPageSize, o: 'name DESC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ],
            [
              {p: 0, c: defaultPageSize, o: 'name DESC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ],
            [
              {p: 0, c: defaultPageSize, o: 'version ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
            ]
          ]);
        });
      });

      describe('when tableState changes', function () {
        describe('casesSearch', function () {
          var defaultPageSize = 1000;
          var defaultSort = 'id';
          var defaultDeployedFields = ['titi', 'tata', 'toto'];
          var anchorScroll = jasmine.createSpy();
          var defaultActiveCounterFields = ['failed', 'ongoing'];

          beforeEach(inject(function ($controller) {
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              'caseAPI': caseAPI,
              'defaultPageSize': defaultPageSize,
              'defaultSort': defaultSort,
              'defaultDeployedFields': defaultDeployedFields,
              'casesColumns': [
                {name: 'AppName', sortName: 'name', path: ['processDefinitionId', 'name']},
                {name: 'Version', sortName: 'version', path: ['processDefinitionId', 'version']},
                {name: 'CaseId', sortName: 'id', path: ['id']}
              ],
              '$anchorScroll': anchorScroll,
              'defaultActiveCounterFields': defaultActiveCounterFields,
              'processId' : undefined,
              'supervisorId' : undefined
            });
          }));
          it('should call default sort on empty tableState', function () {
            deferred.resolve(fullCases);
            scope.$apply();
            expect(anchorScroll).toHaveBeenCalled();

            expect(caseAPI.search.calls.allArgs()).toEqual([
              [
                {p: 0, c: defaultPageSize, o: defaultSort + ' ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
              ]
            ]);
            expect(anchorScroll).toHaveBeenCalled();
          });
          it('should call search on application name sort desc', function () {
            deferred.resolve(fullCases);
            scope.$apply();
            scope.searchForCases({property: 'name', ascendant: false});
            scope.$apply();
            expect(anchorScroll).toHaveBeenCalled();
            scope.searchForCases({property:'name', ascendant: true});
            scope.$apply();
            expect(anchorScroll).toHaveBeenCalled();
            scope.searchForCases({property: 'version', ascendant: false});
            scope.$apply();
            expect(anchorScroll).toHaveBeenCalled();
            expect(caseAPI.search.calls.allArgs()).toEqual([
              [
                {p: 0, c: defaultPageSize, o : 'id ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s: undefined }
              ],
              [
                {p: 0, c: defaultPageSize, o: 'name DESC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
              ],
              [
                {p: 0, c: defaultPageSize, o: 'name ASC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
              ],
              [
                {p: 0, c: defaultPageSize, o: 'version DESC', d: defaultDeployedFields, f: [], n: defaultActiveCounterFields, s : undefined}
              ]
            ]);

          });
        });
      });
      describe('when server returns an error on case search', function () {

        describe('about 401 unauthorized', function () {
          it('should redirect to the login page', inject(function ($controller) {
            var location = {
              url: function () {
              }
            };
            var localPromise = {
              then: function (successMethod, errorMethod) {
                errorMethod({status: 401});
                return localPromise;
              },
              finally: function (finallyMethod) {
                finallyMethod();
                return localPromise;
              }
            };
            spyOn(location, 'url').and.callThrough();
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              'caseAPI': {
                search: function () {
                  return {
                    '$promise': localPromise
                  };
                }
              },
              '$location': location,
              'processId' : undefined,
              'supervisorId' : undefined
            });
            scope.$apply();
            expect(location.url).toHaveBeenCalled();
            expect(location.url.calls.allArgs()).toEqual([
              ['/']
            ]);
          }));
        });
        describe('about 500 Internal Error', function () {
          it('should redirect to the login page', inject(function ($controller) {
            var error = {
              status: 500,
              statusText: 'Internal Server Error',
              data: {resource: 'bpm/case', message: 'Invalid search !!'}
            };
            var localPromise = {
              then: function (successMethod, errorMethod) {
                errorMethod(error);
                return localPromise;
              },
              finally: function (finallyMethod) {
                finallyMethod();
                return localPromise;
              }
            };
            var growl = jasmine.createSpyObj('growl', ['success', 'error', 'info']);
            $controller('ActiveCaseListCtrl', {
              '$scope': scope,
              'caseAPI': {
                search: function () {
                  return {
                    '$promise': localPromise
                  };
                }
              },
              'growl': growl,
              'processId' : undefined,
              'supervisorId' : undefined
            });
            scope.$apply();
            expect(growl.error).toHaveBeenCalled();
            expect(growl.error.calls.allArgs()).toEqual([[
              error.status + ' ' + error.statusText + ' ' + error.data.message,
              {ttl: 3000, disableCountDown: true, disableIcons: true}
            ]]);
          }));
        });
      });
    });

    describe('change column visiblity', function () {
      beforeEach(inject(function ($controller) {
        $controller('ActiveCaseListCtrl', {
          '$scope': scope,
          'processId' : undefined,
          'supervisorId' : undefined
        });
      }));
      it('should set selected to false when it was true', function () {
        var column = {selected: true};
        scope.selectColumn(column);
        expect(column.selected).toBeFalsy();
      });
      it('should set selected to true when it was false', function () {
        var column = {selected: false};
        scope.selectColumn(column);
        expect(column.selected).toBeTruthy();
      });
    });

    describe('filter column ', function () {
      beforeEach(inject(function ($controller) {
        $controller('ActiveCaseListCtrl', {
          '$scope': scope,
          'processId' : undefined,
          'supervisorId' : undefined
        });
      }));
      it('should return false when column is not selected', function () {
        var column = {selected: false};
        expect(scope.filterColumn(column)).toBeFalsy();
      });
      it('should return true when column is selected', function () {
        var column = {selected: true};
        expect(scope.filterColumn(column)).toBeTruthy();
      });
    });

    describe('select nbItems in page ', function () {
      beforeEach(inject(function ($controller) {
        $controller('ActiveCaseListCtrl', {
          '$scope': scope,
          'processId' : undefined,
          'supervisorId' : undefined
        });
        spyOn(scope, 'searchForCases');
      }));
      it('should do nothing if nothing is passed', function () {
        var itemsPerPage = scope.itemsPerPage;
        scope.changeItemPerPage();
        expect(scope.searchForCases).not.toHaveBeenCalled();
        expect(scope.itemsPerPage).toBe(itemsPerPage);
      });
      it('should change the number and reinit page number', function () {
        var itemsPerPage = 50;
        scope.currentPage = 2;
        scope.changeItemPerPage(itemsPerPage);
        expect(scope.searchForCases).toHaveBeenCalledWith();
        expect(scope.pagination.itemsPerPage).toBe(itemsPerPage);
        expect(scope.pagination.currentPage).toBe(1);
      });
    });

    describe('addAlert', function () {
      var growl = jasmine.createSpyObj('growl', ['success', 'error', 'info']);
      beforeEach(inject(function ($controller) {
        $controller('ActiveCaseListCtrl', {
          '$scope': scope,
          'growl' : growl,
          'processId' : undefined,
          'supervisorId' : undefined
        });
      }));
      it('should call growl to add Notification error', function(){
        var error = {
          status: 500,
          statusText: 'Internal Server Error',
          errorMsg : 'Invalid search on bpm/case',
          type : 'danger'
        };
        scope.addAlert(error);
        expect(growl.error).toHaveBeenCalled();
        expect(growl.error.calls.allArgs()).toEqual([[
          error.status + ' ' + error.statusText + ' ' + error.errorMsg,
          {ttl: 3000, disableCountDown: true, disableIcons: true}
        ]]);
      });
      it('should call growl to add Notification success', function(){
        var error = {
          statusText: 'successfully deleted 1 case',
          type : 'success'
        };
        scope.addAlert(error);
        expect(growl.success).toHaveBeenCalled();
        expect(growl.success.calls.allArgs()).toEqual([[
          error.statusText,
          {ttl: 3000, disableCountDown: true, disableIcons: true}
        ]]);
      });
      it('should call growl to add Notification default', function(){
        var error = {
          statusText: 'successfully deleted 1 case'
        };
        scope.addAlert(error);
        expect(growl.info).toHaveBeenCalled();
        expect(growl.info.calls.allArgs()).toEqual([[
          error.statusText,
          {ttl: 3000, disableCountDown: true, disableIcons: true}
        ]]);
      });
    });

    describe('reinitCases', function () {
      it('should remove sort and set page to 1', inject(function ($controller) {
        $controller('ActiveCaseListCtrl', {
          '$scope': scope,
          'processId' : undefined,
          'supervisorId' : undefined
        });
        scope.searchSort = {};
        scope.pagination.currentPage = 10;
        spyOn(scope, 'searchForCases');
        scope.reinitCases();
        expect(scope.searchSort).toBeUndefined();
        expect(scope.pagination.currentPage).toBe(1);
        expect(scope.searchForCases).toHaveBeenCalledWith();
      }));
    });
    describe('filter updates', function () {
      beforeEach(inject(function ($controller) {

        var localPromise = {
          then: function () {
            return localPromise;
          },
          finally: function (finallyMethod) {
            finallyMethod();
            return localPromise;
          }
        };
        $controller('ActiveCaseListCtrl', {
          '$scope': scope,
          'store': {
            load: function () {
              return {
                then: function () {
                }
              };
            }
          },
          'caseAPI': {
            search: function () {
              return {
                '$promise': localPromise
              };
            }
          },
          'processId' : undefined,
          'supervisorId' : undefined
        });
        scope.$apply();
        spyOn(scope, 'searchForCases');
      }));
      describe('watch on filters', function () {
        it('should call search when filters update', function () {
          scope.filters = [
            {}
          ];
          scope.pagination.currentPage = 2;
          scope.$apply();
          expect(scope.searchForCases).toHaveBeenCalled();
          expect(scope.pagination.currentPage).toBe(1);
        });
        it('should not call search when processId is set', function () {
          scope.filters = [
            {}
          ];
          scope.pagination.currentPage = 2;
          scope.selectedFilters.processId = 1;
          scope.$apply();
          expect(scope.searchForCases).not.toHaveBeenCalled();
          expect(scope.pagination.currentPage).toBe(1);
        });
      });
      describe('build filter', function () {
        it('should have process definition Id', function () {
          var processId = '2121354687951';
          scope.selectedFilters.selectedProcessDefinition = processId;
          scope.buildFilters();
          expect(scope.filters).toEqual(['processDefinitionId=' + processId]);
          expect(scope.pagination.currentPage).toBe(1);
        });
        it('should have process definition Id only even id app name is set', function () {
          var processId = '2121354687951';
          scope.selectedFilters.selectedProcessDefinition = processId;
          scope.selectedFilters.selectedApp = 'Process1';
          scope.buildFilters();
          expect(scope.filters).toEqual(['processDefinitionId=' + processId]);
          expect(scope.pagination.currentPage).toBe(1);
        });
        it('should have app name', function () {
          scope.$digest();
          var processName = 'Process1';
          scope.selectedFilters.selectedApp = processName;
          scope.buildFilters();
          expect(scope.filters).toEqual(['name=' + processName]);
          expect(scope.pagination.currentPage).toBe(1);
        });
      });
    });
  });
})();
