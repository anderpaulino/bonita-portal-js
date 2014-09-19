describe('i18nService', function() {

  var i18nService, i18nAPI, $cookies, gettextCatalog, deferred;

  beforeEach(module('org.bonita.portal'));

  beforeEach(inject(function(_i18nService_, _i18nAPI_, _$cookies_, _gettextCatalog_, $q) {
    i18nService = _i18nService_;
    i18nAPI = _i18nAPI_;
    $cookies = _$cookies_;
    gettextCatalog = _gettextCatalog_;
    deferred = $q.defer();
    spyOn(i18nAPI, 'query').and.callFake(function() {
      return {$promise: deferred.promise};
    })
  }));

  it('should get english as default local if none found', function() {
    $cookies['BOS_Locale'] = undefined;

    i18nService.loadTranslations();

    expect(i18nAPI.query).toHaveBeenCalledWith({
      f: 'locale=en'
    });
  });

  it('should get the local found in the cookie', function() {
    $cookies['BOS_Locale'] = "fr";

    i18nService.loadTranslations();

    expect(i18nAPI.query).toHaveBeenCalledWith({
      f: 'locale=fr'
    });
  });

  it('should set gettextCatalog local', inject(function($rootScope, $httpBackend) {
    $httpBackend.expectGET().respond(function () { return {}; });
    $cookies['BOS_Locale'] = "fr";

    i18nService.loadTranslations();
    deferred.resolve([{ key: 'Hello', value: 'Bonjour' }]);
    $rootScope.$apply();

    expect(gettextCatalog.currentLanguage).toBe('fr');
  }));
});