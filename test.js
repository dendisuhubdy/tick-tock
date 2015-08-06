/* istanbul ignore next */
describe('ticktock', function () {
  'use strict';

  var assume = require('assume')
    , Tick = require('./')
    , Timer = Tick.Timer
    , tock;

  function fail() {
    throw new Error('I should never be executed');
  }

  //
  // Make sure that we do not break on missing hasOwn checks.
  //
  Object.prototype.checkHasOwn = true;

  var context = { foo: 'bar' };

  beforeEach(function () {
    tock = new Tick();
  });

  afterEach(function () {
    tock.end();
  });

  this.timeout(30000);

  it('is exported as a function', function () {
    assume(Tick).is.a('function');
  });

  it('can be constructed without new', function () {
    var tick = Tick();

    assume(tick).is.instanceOf(Tick);
  });

  describe('Timer', function () {
    describe('#taken', function () {
      it('calculates the time it has taken since first creation', function (next) {
        var timer = new Timer(undefined, undefined, 100);

        assume(timer.taken()).between(0, 1);

        setTimeout(function () {
          assume(timer.taken()).between(5, 15);
          next();
        }, 10);
      });
    });

    describe('#remaining', function () {
      it('calculates the time remaining', function (next) {
        var timer = new Timer(undefined, undefined, 100);

        assume(timer.remaining()).between(99, 100);

        setTimeout(function () {
          assume(timer.remaining()).between(20, 35);
          next();
        }, 70);
      });
    });
  });

  describe('#tock', function () {
    it('returns a function', function () {
      assume(tock.tock('name')).is.a('function');
    });

    it('is save to execute', function () {
      tock.tock('name')();
    });

    it('can execute timers', function () {
      var called = false;

      tock.setTimeout('function', function () {
        called = true;
      }, 0);

      assume(called).is.false();
      tock.tock('function', true)();
      assume(called).is.true();
    });
  });

  describe('#setInterval', function () {
    it('adds a setInterval', function (next) {
      var start = Date.now()
        , i = 0;

      tock.setInterval('test', function () {
        var taken = Date.now() - start;

        assume(this).equals(tock);

        if (i === 0) {
          assume(taken).is.above(5);
          assume(taken).is.below(25);
        } else {
          next();
        }

        i++;
      }, 10);
    });

    it('can be called with a custom context', function (next) {
      var tock = new Tick(context);

      tock.setInterval('test', function () {
        assume(this).deep.equals(context);
        tock.clear();

        next();
      }, 10);
    });

    it('accepts strings for time', function (next) {
      var start = Date.now()
        , i = 0;

      tock.setInterval('test', function () {
        var taken = Date.now() - start;

        if (i === 0) {
          assume(taken).is.above(5);
          assume(taken).is.below(25);
        } else {
          next();
        }

        i++;
      }, '10 ms');
    });

    it('run with the same timeout if a known name is provided', function (next) {
      var j = 0
        , i = 0;

      tock.setInterval('test', function () {
        j++;
      }, '100 ms');

      setTimeout(function () {
        tock.setInterval('test', function () {
          i++;

          if (i === 10) {
            assume(j).equals(i);
            next();
          }
        }, '100 ms');
      }, 20);
    });

    it('updates the start time of the timer instance', function (next) {
      tock.setInterval('timer', function () {}, 100);

      setTimeout(function () {
        assume(tock.timers.timer.remaining()).is.between(40, 65);
        next();
      }, 250);
    });
  });

  describe('#setImmediate', function () {
    it('adds a setImmediate', function (next) {
      var start = Date.now();

      tock.setImmediate('test', function () {
        var taken = Date.now() - start;

        assume(this).equals(tock);
        assume(taken).is.below(5);

        next();
      });
    });

    it('can be called with a custom context', function (next) {
      var tock = new Tick(context);

      tock.setImmediate('test', function () {
        assume(this).deep.equals(context);
        next();
      });
    });

    it('can be cleared', function (next) {
      var tock = new Tick(context);

      tock.setImmediate('test', function () {
        throw new Error('I should die');
      });

      tock.clear('test');
      setTimeout(next, 100);
    });

    it('clear it self after execution', function (next) {
      var tock = new Tick(context);

      tock.setImmediate('test', function () {
        tock.setImmediate('test', function () {
          next();
        });
      });
    });

    it('run with the same timeout if a known name is provided', function (next) {
      var ticks = [];

      tock.setImmediate('test', function () {
        ticks.push(1);
      });

      tock.setImmediate('test', function () {
        ticks.push(2);
        assume(ticks.join()).equals('1,2');
        next();
      });

      assume(tock.timers.test.fns).is.length(2);
    });

    if ('function' === typeof setImmediate)
    it('fallsback to setTimeout if setImmediate does not exist', function (next) {
      setImmediate = null;
      tock.setImmediate('test', next);
    });
  });

  describe('#setTimeout', function () {
    it('adds a setTimeout', function (next) {
      var start = Date.now();

      tock.setTimeout('test', function () {
        var taken = Date.now() - start;
        assume(this).deep.equals(tock);

        assume(taken).is.above(5);
        assume(taken).is.below(15);

        next();
      }, 10);
    });

    it('can be called with a custom context', function (next) {
      var tock = new Tick(context);

      tock.setTimeout('test', function () {
        assume(this).deep.equals(context);
        tock.clear();

        next();
      }, 10);
    });

    it('accepts strings for time', function (next) {
      var start = Date.now();

      tock.setTimeout('test', function () {
        var taken = Date.now() - start;

        assume(taken).is.above(5);
        assume(taken).is.below(15);

        next();
      }, '10 ms');
    });

    it('run with the same timeout if a known name is provided', function (next) {
      var start = Date.now();

      tock.setTimeout('test', function () {
        var taken = Date.now() - start;

        assume(taken).is.above(95);
        assume(taken).is.below(110);
      }, '100 ms');

      setTimeout(function () {
        tock.setTimeout('test', function () {
          var taken = Date.now() - start;

          assume(taken).is.above(95);
          assume(taken).is.below(110);

          next();
        }, '100 ms');
      }, 20);
    });
  });

  describe('#clear', function () {
    it('clears multiple timeouts', function (next) {
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timers', fail, '10 ms');
      tock.setTimeout('timers', fail, 0);

      tock.clear('timer', 'timers');

      setTimeout(function () {
        next();
      }, 1010);
    });

    it('splits the string if only one argument is supplied', function (next) {
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timers', fail, '10 ms');
      tock.setTimeout('timers', fail, 0);

      tock.clear('timer, timers, non-existing');

      setTimeout(function () {
        next();
      }, 1010);
    });

    it('clears all if no arguments are supplied', function (next) {
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timer', fail, '1 second');
      tock.setTimeout('timers', fail, '10 ms');
      tock.setTimeout('timers', fail, 0);

      tock.clear();

      setTimeout(function () {
        next();
      }, 1010);
    });
  });

  describe('#active', function () {
    it('returns true if a timer is defined', function () {
      assume(tock.active('foo')).is.false();

      tock.setTimeout('foo', function () {});
      assume(tock.active('foo')).is.true();

      tock.clear();
      assume(tock.active('foo')).is.false();
    });
  });

  describe('#adjust', function () {
    it('adjusts nothing for unknown timers', function () {
      tock.adjust('foo', '1 second');
    });

    it('adjusts the timeout', function (next) {
      tock.setTimeout('timer', fail, '10 ms');
      tock.adjust('timer', '1 second');

      setTimeout(function () {
        tock.clear();
        next();
      }, 500);
    });

    it('also adjusts the timer instance start time', function (next) {
      tock.setTimeout('timer', fail, '100 ms');

      setTimeout(function () {
        assume(tock.timers.timer.remaining()).is.between(80, 95);
        assume(tock.timers.timer.taken()).is.between(5, 15);

        tock.adjust('timer', '1 second');

        assume(tock.timers.timer.taken()).is.between(0, 1);
        assume(tock.timers.timer.remaining()).is.between(999, 1000);

        tock.clear();
        next();
      }, 10);
    });

    it('adjusts the interval', function (next) {
      var start = Date.now()
        , counter = 0
        , elapsed;

      tock.setInterval('foo', function () {
        elapsed = Date.now() - start;

        if (++counter === 1) {
          assume(elapsed).is.below(30);
          tock.adjust('foo', '100 ms');
        } else if (counter === 3) {
          assume(elapsed).is.between(200, 250);
          tock.clear();
          next();
        }
      });
    });
  });

  describe('#end', function () {
    it('returns true when its cleared the first time', function () {
      assume(tock.end()).is.true();
    });

    it('returns false when already cleared', function () {
      assume(tock.end()).is.true();
      assume(tock.end()).is.false();
    });
  });
});
