(function () {
  'use strict';
  /**
   * @ngdoc overview
   * @name o.b.f.admin.cases.list
   *
   * @description
   * describes the case list components
   */

  angular.module('org.bonita.features.admin.cases.list', ['org.bonita.common.resources', 'gettext', 'smart-table', 'ui.bootstrap', 'lrDragNDrop', 'org.bonita.common.resources.store', 'gettext', 'org.bonita.common.directives.selectAll', 'angular-growl', 'ngAnimate', 'gettext'])
    .config(['growlProvider', function (growlProvider) {
      growlProvider.globalPosition('top-center');
    }])
    .value('casesColumns', [
      {name: 'App name', sortName: 'name', path: ['processDefinitionId', 'name'], selected: true},
      {name: 'Version', sortName: 'version', path: ['processDefinitionId', 'version'], selected: true},
      {name: 'ID', sortName: 'id', path: ['id'], selected: true, align: 'right'},
      {name: 'Start date', sortName: 'startDate', path: ['start'], selected: true, date: true},
      {name: 'Started by', sortName: 'username', path: ['started_by', 'userName'], selected: true},
      {name: 'State', sortName: 'stateId', path: ['state'], selected: true}
    ])
    .value('caseStatusValues', {started: 'Started', error: 'Failed'})
    .value('pageSizes', [25, 50, 100, 200])
    .value('defaultPageSize', 25)
    .value('defaultSort', 'id')
    .value('defaultFilters', {appVersion: 'All versions', appName: 'All apps', caseStatus: 'All states'})
    .value('defaultDeployedFields', ['processDefinitionId', 'started_by', 'startedBySubstitute'])
    .controller('caseFilterController', ['$scope', 'store', 'processAPI', 'defaultFilters', 'caseStatusValues', function ($scope, store, processAPI, defaultFilters, caseStatusValues) {
      $scope.selectedApp = defaultFilters.appName;
      $scope.selectedVersion = defaultFilters.appVersion;
      $scope.selectedStatus = defaultFilters.caseStatus;
      $scope.defaultFilters = defaultFilters;
      $scope.caseStatusValues = caseStatusValues;
      $scope.caseStatusValues[defaultFilters.caseStatus] = defaultFilters.caseStatus;
      $scope.apps = [];
      $scope.versions = [];
      $scope.appNames = [];
      $scope.allCasesSelected = false;

      store.load(processAPI, {}).then(function (processes) {
        $scope.apps = processes;
        var appNamesArray = processes.map(function (process) {
          return process.name;
        });
        appNamesArray.forEach(function (processName) {
          if (processName && $.inArray(processName, $scope.appNames) <= 0) {
            $scope.appNames.push(processName);
          }
        });
      });

      $scope.selectApp = function (selectedAppName) {
        if (selectedAppName) {
          if (selectedAppName !== $scope.selectedApp) {
            $scope.selectedApp = selectedAppName;
          }
          //selected App is the same than before, do nothing
        } else {
          $scope.selectedApp = defaultFilters.appName;
        }
      };

      $scope.selectVersion = function (selectedAppVersion) {
        if (selectedAppVersion && selectedAppVersion !== defaultFilters.appVersion) {
          $scope.selectedVersion = selectedAppVersion;
        } else {
          $scope.selectedVersion = defaultFilters.appVersion;
        }
      };

      $scope.selectCaseStatus = function (selectCaseStatus) {
        if (selectCaseStatus && selectCaseStatus !== defaultFilters.caseStatus) {
          $scope.selectedStatus = selectCaseStatus;
        } else {
          $scope.selectedStatus = defaultFilters.caseStatus;
        }
      };

      $scope.filterVersion = function (appName) {
        $scope.versions = [];
        $scope.selectedVersion = defaultFilters.appVersion;
        if ($scope.apps && $scope.apps.filter) {
          $scope.versions = $scope.apps.filter(function (app) {
            return app && app.name === appName && app.version;
          }).map(function (app) {
            return app.version;
          });
        }
        if ($scope && $scope.versions && $scope.versions.length === 1) {
          $scope.selectedVersion = $scope.versions[0];
        }
      };

      $scope.filterProcessDefinition = function (selectedAppVersion) {
        if (selectedAppVersion && $scope.selectedApp && $scope.apps) {
          var matchingProcessDefs = $scope.apps.filter(function (app) {
            return app && app.name === $scope.selectedApp && selectedAppVersion === app.version;
          });
          if (matchingProcessDefs && matchingProcessDefs.length) {
            $scope.selectedProcessDefinition = matchingProcessDefs[0] && matchingProcessDefs[0].id;
          } else {
            delete $scope.selectedProcessDefinition;
          }
        } else {
          delete $scope.selectedProcessDefinition;
        }
      };
      //we cannot watch the updateFilter function directly otherwise
      //it will not be mockable
      $scope.$watch('selectedApp', function () {
        $scope.filterVersion($scope.selectedApp);
        delete $scope.selectedProcessDefinition;
        $scope.buildFilters();
      });
      $scope.$watch('selectedVersion', function () {
        $scope.filterProcessDefinition($scope.selectedVersion);
        $scope.buildFilters();
      });
      $scope.$watch('selectedStatus', function () {
        $scope.buildFilters();
      });
    }])
    .directive('caseFilters', function () {
      return {
        restrict: 'E',
        require: '^CaseListCtrl',
        templateUrl: 'features/admin/cases/cases-list-filters.html',
        controller: 'caseFilterController'
      };
    })
    .controller('CaseListCtrl', CaseListCtrl)
    .controller('CaseDeleteCtrl', CaseDeleteCtrl)
    .directive('caseDelete',
    function () {
      return {
        restrict: 'A',
        require: '^CaseListCtrl',
        controller: 'CaseDeleteCtrl'
      };
    })
    .controller('DeleteCaseModalCtrl', DeleteCaseModalCtrl)
    .directive('resizableColumn', ['$timeout', '$interval', function ($timeout) {
      return {
        restrict: 'A',
        link: function (scope, $el) {
          var resizeColumn = function () {
            $timeout(function () {
              var data = $el.data('resizableColumns');
              if (data) {
                data.destroy();
              }
              $el.resizableColumns({selector: 'tr th'});
            }, 0);
          };
          scope.$watch('columns', resizeColumn, true);
        }
      };
    }]);

  //////////////////////

  CaseDeleteCtrl.$inject = ['$scope', '$modal', 'caseAPI', 'gettextCatalog'];

  /**
   * @ngdoc object
   * @name o.b.f.admin.cases.list.CaseDeleteCtrl
   * @description
   * This is a controller that manages the case deletion behaviour
   *
   * @requires $scope
   * @requires $modal
   * @requires caseAPI
   * @requires gettextCatalog
   */
  /* jshint -W003 */
  function CaseDeleteCtrl ($scope, $modal, caseAPI, gettextCatalog) {
    /* jshint +W003 */
    /**
     * @ngdoc method
     * @name o.b.f.admin.cases.list.CaseDeleteCtrl#confirmDeleteSelectedCases
     * @methodOf o.b.f.admin.cases.list.CaseDeleteCtrl
     * @description
     * It opens a modal asking for a confirmation to delete the selected case(s).<br>
     * If the confirmation is selected, the {@link o.b.f.admin.cases.list.CaseDeleteCtrl#deleteSelectedCases deleteSelectedCases}
     * is called upon selected cases
     */
    $scope.confirmDeleteSelectedCases = function confirmDeleteSelectedCases() {
      if ($scope.cases) {
        var caseItems = $scope.cases.filter(function filterSelectedOnly(caseItem) {
          return caseItem && caseItem.selected;
        });
        $modal.open({
          templateUrl: 'features/admin/cases/cases-list-deletion-modal.html',
          controller: 'DeleteCaseModalCtrl',
          resolve: {
            caseItems: function () {
              return caseItems;
            }
          },
          size: 'sm'
        }).result.then($scope.deleteSelectedCases);
      }
    };
    /**
     * @ngdoc method
     * @name o.b.f.admin.cases.list.CaseDeleteCtrl#checkCaseIsNotSelected
     * @methodOf o.b.f.admin.cases.list.CaseDeleteCtrl
     * @description
     * @returns {Boolean} true if no case are selected
     */
    $scope.checkCaseIsNotSelected = function checkCaseIsNotSelected() {
      return $scope.cases && $scope.cases.reduce(function (previousResult, caseItem) {
          return previousResult && !caseItem.selected;
        }, true);
    };

    /**
     * @ngdoc method
     * @name o.b.f.admin.cases.list.CaseDeleteCtrl#deleteSelectedCases
     * @methodOf o.b.f.admin.cases.list.CaseDeleteCtrl
     * @description
     * For each selected case, it calls delete with the case id, chaining the
     * calls until all calls have been made. finally, it displays a message indicating
     * how many items it has successfully deleted
     */
    $scope.deleteSelectedCases = function deleteSelectedCases() {
      if ($scope.cases) {
        var caseIds = $scope.cases.filter(function (caseItem) {
          return caseItem && caseItem.selected && caseItem.id;
        }).map(function (caseItem) {
          return caseItem.id;
        });
        var nbOfDeletedCases = 0;
        if (caseIds && caseIds.length) {
          //this function chains the case deletion
          var deletePromise = function (id) {
            var currentPromise = caseAPI.delete({id: id}).$promise.then(function () {
              nbOfDeletedCases++;
            }, $scope.displayError);
            if (caseIds && caseIds.length) {
              var deleteNextId = function deleteNextId() {
                deletePromise(caseIds.pop());
              };
              currentPromise.finally(deleteNextId);
            } else {
              currentPromise.then(function () {
                $scope.addAlert({type: 'success', status: gettextCatalog.getPlural(nbOfDeletedCases, '{{nbOfDeletedCases}} case deleted successfully', '{{nbOfDeletedCases}} cases deleted successfully', {nbOfDeletedCases : nbOfDeletedCases})});
              }).finally(function () {
                $scope.pagination.currentPage = 1;
                $scope.searchForCases();
              });
            }
          };
          deletePromise(caseIds.pop());
        }
      }
    };
  }

  DeleteCaseModalCtrl.$inject = ['$scope', '$modalInstance', 'caseItems'];

  /**
   * @ngdoc object
   * @name o.b.f.admin.cases.list.DeleteCaseModalCtrl
   * @description
   * This is a controller that manages the deletion modal
   *
   * @requires $scope
   * @requires $modalInstance
   * @requires caseItems
   */
  function DeleteCaseModalCtrl($scope, $modalInstance, caseItems) {
    $scope.caseItems = caseItems;

    /**
     * @ngdoc method
     * @name o.b.f.admin.cases.list.DeleteCaseModalCtrl#ok
     * @methodOf o.b.f.admin.cases.list.DeleteCaseModalCtrl
     * @description
     * confirms the case deletion and launch resolve on the modal promise<br>
     * see {@link o.b.f.admin.cases.list.CaseDeleteCtrl#confirmDeleteSelectedCases confirmDeleteSelectedCases}
     *
     */
    $scope.ok = function () {
      $modalInstance.close();
    };

    /**
     * @ngdoc method
     * @name o.b.f.admin.cases.list.DeleteCaseModalCtrl#cancel
     * @methodOf o.b.f.admin.cases.list.DeleteCaseModalCtrl
     * @description
     * cancels the case deletion and launch reject on modal promise
     */
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }

  CaseListCtrl.$inject = ['$scope', 'caseAPI', 'casesColumns', 'defaultPageSize', 'defaultSort', 'defaultDeployedFields', '$location', 'pageSizes', 'defaultFilters', '$filter', '$anchorScroll', 'growl', '$log', '$window'];

  /**
   * @ngdoc object
   * @name o.b.f.admin.cases.list.CaseListCtrl
   * @description
   * This is a controller that manages the case list table
   *
   * @requires $scope
   * @requires caseAPI
   * @requires casesColumns
   * @requires defaultPageSize
   * @requires defaultSort
   * @requires defaultDeployedFields
   * @requires $location
   * @requires $window
   * @requires pageSizes
   * @requires defaultFilters
   * @requires $filter
   * @requires $anchorScroll
   * @requires growl
   */
  function CaseListCtrl($scope, caseAPI, casesColumns, defaultPageSize, defaultSort, defaultDeployedFields, $location, pageSizes, defaultFilters, $filter, $anchorScroll, growl, $log, $window) {
    /**
     * @ngdoc property
     * @name o.b.f.admin.cases.list.CaseListCtrl#columns
     * @propertyOf o.b.f.admin.cases.list.CaseListCtrl
     * @description
     * an array of columns to display in the case table and the way
     * to display and retrieve the content
     */
    $scope.columns = casesColumns;
    /**
     * @ngdoc property
     * @name o.b.f.admin.cases.list.CaseListCtrl#pagination
     * @propertyOf o.b.f.admin.cases.list.CaseListCtrl
     * @description
     * an object containing the pagination state
     */
    $scope.pagination = {
      itemsPerPage: defaultPageSize,
      currentPage: 1,
      total: 0
    };
    $scope.pageSizes = pageSizes;
    /**
     * @ngdoc property
     * @name o.b.f.admin.cases.list.CaseListCtrl#cases
     * @propertyOf o.b.f.admin.cases.list.CaseListCtrl
     * @description
     * the array of cases to display
     */
    $scope.cases = [];


    $scope.filters = [];


    $scope.reinitCases = function () {
      delete $scope.searchSort;
      $scope.pagination.currentPage = 1;
      $scope.searchForCases();
    };
    $scope.addAlert = function (msg) {
      var options = {ttl: 3000, disableCountDown: true, disableIcons: true};
      var content = ((msg.status || '') + ' ' + (msg.statusText || '') + ' ' + (msg.errorMsg || '')).trim();
      switch (msg.type) {
        case 'success':
          growl.success(content, options);
          break;
        case 'danger':
          growl.error(content, options);
          break;
        default:
          growl.info(content, options);
      }
    };

    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };

    $scope.$watch('filters', function () {
      $scope.pagination.currentPage = 1;
      $scope.searchForCases();
    }, true);

    $scope.buildFilters = function () {
      var filters = [];
      if ($scope.selectedProcessDefinition) {
        filters.push('processDefinitionId=' + $scope.selectedProcessDefinition);
      } else if ($scope.selectedApp && $scope.selectedApp !== defaultFilters.appName) {
        filters.push('name=' + $scope.selectedApp);
      }
      if ($scope.selectedStatus && $scope.selectedStatus !== defaultFilters.caseStatus) {
        filters.push('state=' + $scope.selectedStatus);
      }
      $scope.filters = filters;
    };

    $scope.searchForCases = function casesSearch(tableState) {
      if (!$scope.searchSort || tableState) {
        $scope.searchSort = ((tableState && tableState.sort && tableState.sort.predicate) ?
          tableState.sort.predicate : defaultSort) + ' ' + ((tableState && tableState.sort && tableState.sort.reverse) ? 'DESC' : 'ASC');
        $scope.pagination.currentPage = 1;
      }

      var caseSearch = caseAPI.search({
        p: $scope.pagination.currentPage - 1,
        c: $scope.pagination.itemsPerPage,
        d: defaultDeployedFields,
        o: $scope.searchSort,
        f: $scope.filters
      });

      caseSearch.$promise.then(function mapCases(fullCases) {
        $scope.pagination.total = fullCases && fullCases.resource && fullCases.resource.pagination && fullCases.resource.pagination.total;
        $scope.currentFirstResultIndex = (($scope.pagination.currentPage - 1) * $scope.pagination.itemsPerPage) + 1;
        $scope.currentLastResultIndex = Math.min($scope.currentFirstResultIndex + $scope.pagination.itemsPerPage - 1, $scope.pagination.total);
        $scope.cases = fullCases && fullCases.resource && fullCases.resource.map(function selectOnlyInterestingFields(fullCase) {
          var simpleCase = {};
          for (var i = 0; i < $scope.columns.length; i++) {
            var currentCase = fullCase;
            for (var j = 0; j < $scope.columns[i].path.length; j++) {
              currentCase = currentCase && currentCase[$scope.columns[i].path[j]];
            }
            simpleCase[$scope.columns[i].name] = currentCase;
          }
          simpleCase.id = fullCase.id;
          return simpleCase;
        });
      }, function (error) {
        $scope.pagination.total = 0;
        $scope.currentFirstResultIndex = 0;
        $scope.currentLastResultIndex = 0;
        $scope.cases = [];
        $scope.displayError(error);
      }).finally(function () {
        $anchorScroll();
      });
    };

    $scope.displayError = function (error) {
      if (error) {
        if (error.status === 401) {
          $location.url('/');
        } else {
          var message = {status: error.status, statusText: error.statusText, type: 'danger'};
          if (error.data) {
            message.errorMsg = error.data.message;
            message.resource = error.data.api + '/' + error.data.resource;
          }
          $scope.addAlert(message);
        }
      }
    };

    $scope.searchForCases();

    $scope.getCurrentProfile = function(){
      var currentProfileMatcher = $window.top.location.hash.match(/\b_pf=\d+/);
      return (currentProfileMatcher.length)?currentProfileMatcher[0]:'';
    };

    $scope.goToCase = function (caseItemId){
      $window.top.location.hash='id='+caseItemId+'&_p=casemoredetailsadmin&'+$scope.getCurrentProfile();
    };

 $scope.selectColumn = function (column) {
      if (column) {
        column.selected = !column.selected;
      }
    };

    $scope.filterColumn = function (column) {
      return column && column.selected;
    };

    $scope.changeItemPerPage = function (pageSize) {
      if (pageSize) {
        $scope.pagination.itemsPerPage = pageSize;
        $scope.pagination.currentPage = 1;
        $scope.searchForCases();
      }
    };
    $scope.formatContent = function (column, data) {
      if (column && column.date && data && typeof data === 'string') {
        //received date is in a non-standard format...
        // convert 2014-10-17 16:05:42.626 to ISO-8601 Format 2014-10-17T16:05:42.626Z
        return $filter('date')(data.replace(/ /, 'T'), 'yyyy-MM-dd HH:mm');
      }
      return data;
    };
  }
})();