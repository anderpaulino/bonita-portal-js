(function () {
  'use strict';
  /**
   * @ngdoc overview
   * @name o.b.f.admin.cases.list.formatContent
   *
   * @description
   * describes the case list components
   */

  angular.module('org.bonita.features.admin.cases.list.formatContent', [
    'org.bonita.features.admin.cases.list.values',
    'org.bonita.features.admin.cases.list.flownodePopover',
    'gettext',
    'ui.bootstrap',
    'org.bonita.services.topurl'
  ]).controller('formatContentController', ['$scope', 'manageTopUrl', 'gettextCatalog', function ($scope, manageTopUrl, gettextCatalog) {
    if ($scope.column && $scope.column.linkToProcess) {
      $scope.linkToProcess = manageTopUrl.getPath() + manageTopUrl.getSearch() + '#?id=' + $scope.caseItem.processDefinitionId.id + '&_p=processmoredetails'+
        ((!!Number($scope.processManager))?'pm':'admin') +
        '&' + manageTopUrl.getCurrentProfile();
    } else if ($scope.column && $scope.column.linkToCase) {
      $scope.linkToCase = manageTopUrl.getPath() + manageTopUrl.getSearch() + '#?id=' + $scope.caseItem.id + '&_p=' + $scope.moreDetailToken + '&' + manageTopUrl.getCurrentProfile();
    }
    $scope.dateFormat = gettextCatalog.getString('MM/dd/yyyy h:mm:ss a');
  }])
    .directive('formatContent', ['$filter', '$compile', 'gettextCatalog',
      function ($filter, $compile) {
        return {
          template: '<div></div>',
          replace: true,
          restrict: 'AE',
          scope: {
            column: '=',
            caseItem: '=',
            moreDetailToken: '@',
            fillPopover: '&',
            processManager : '@' //needs the processManager to be '0' or '1' order for controller to process it simply
          },
          controller: 'formatContentController',
          link: function ($scope, $element) {
            var contents = '';
            if ($scope.column && $scope.column.date && $scope.caseItem[$scope.column.name] && typeof $scope.caseItem[$scope.column.name] === 'string') {
              //received date is in a non-standard format...
              // convert 2014-10-17 16:05:42.626 to ISO-8601 Format 2014-10-17T16:05:42.626Z
              contents = $filter('date')($scope.caseItem[$scope.column.name].replace(/ /, 'T'), $scope.dateFormat);
            } else if ($scope.column && $scope.column.popover) {
              contents = '<span class="badge">' + $scope.caseItem[$scope.column.name] + '</span>';
            } else if ($scope.column && $scope.column.linkToProcess) {
              contents = '<a id="case-process-link-' + $scope.caseItem.id + '" target="_top" href="' + $scope.linkToProcess + '">' + $scope.caseItem[$scope.column.name] + '</a>';
            } else if ($scope.column && $scope.column.linkToCase) {
              contents = '<a id="case-detail-link-' + $scope.caseItem.id + '" target="_top" href="' + $scope.linkToCase + '">' + $scope.caseItem[$scope.column.name] + '</a>';
            } else {
              contents = $scope.caseItem[$scope.column.name];
            }
            $element.html(contents);
            //to enable directive injection, we need to compile the created element contents
            $compile($element)($scope);
          }
        };
      }]);
})();
