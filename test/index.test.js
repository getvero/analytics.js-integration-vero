'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Vero = require('../lib/');

describe('Vero', function() {
  var analytics;
  var vero;
  var options = {
    apiKey: '99504fea17d9b70805e470a672af1c5b608eb88f'
  };

  beforeEach(function() {
    analytics = new Analytics();
    vero = new Vero(options);
    analytics.use(Vero);
    analytics.use(tester);
    analytics.add(vero);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    vero.reset();
    sandbox();
  });

  it('should store the proper settings', function() {
    analytics.compare(Vero, integration('Vero')
      .global('_veroq')
      .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(vero, 'load');
    });

    describe('#initialize', function() {
      it('should push onto window._veroq', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._veroq[0], ['init', { api_key: options.apiKey }]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(vero.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(vero, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('should push "viewed_page"', function() {
        analytics.page({ referrer: 'http://localhost:9876/?id=42' });
        analytics.called(window._veroq.push, ['track', 'viewed_page', {
          referrer: 'http://localhost:9876/?id=42',
          path: '/context.html',
          search: '',
          title: '',
          url: 'http://localhost:9876/context.html'
        },{ source: 'segment' }]);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('shouldnt send without an id', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._veroq.push);
      });

      it('should send with just an id', function() {
        analytics.identify('id');
        analytics.called(window._veroq.push, ['user', {
          id: 'id'
        }]);
      });

      it('should send with just an email', function() {
        analytics.identify(null, { email: 'name@example.com' });
        analytics.called(window._veroq.push, ['user', {
          email: 'name@example.com'
        }]);
      });

      it('should send an id and email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.called(window._veroq.push, ['user', {
          id: 'id',
          email: 'name@example.com'
        }]);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', {
          email: 'name@example.com',
          trait: true
        });
        analytics.called(window._veroq.push, ['user', {
          id: 'id',
          email: 'name@example.com',
          trait: true
        }]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._veroq.push, ['track', 'event', {}, { source: 'segment' }]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._veroq.push, ['track', 'event', { property: true }, { source: 'segment' }]);
      });

      it('should send an unsubscribe event in the correct format', function() {
        analytics.track('unsubscribe', { id: 'id' });
        analytics.called(window._veroq.push, ['unsubscribe', { id: 'id' }]);
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('should send a new id', function() {
        analytics.alias('new');
        analytics.called(window._veroq.push, ['reidentify', 'new']);
      });

      it('should send a new and old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window._veroq.push, ['reidentify', 'new', 'old']);
      });
    });
  });
});
