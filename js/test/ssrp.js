(function() {


    module('require');
    test('hash sha1', function() {
        equal(ssrp.HASH.sha1('test'), 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
    });
    test('hash sha512', function() {
        equal(ssrp.HASH.sha512('test'), 'ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff');
    });
    test('BitInteger', function() {
        var num = new BigInteger('123456');
        equal(num.toString(), '123456');

        var num = new BigInteger('ff', 16);
        equal(num.toString(), '255');

        var num = new BigInteger('255');
        equal(num.toString(16), 'ff');
    });



    var _ = {};

    module('ssrp', {
        setup: function() {

            _.I = 'user';
            _.p = 'password';
            _.ng_type = '1024';
            _.hash_type = 'sha1'
            _.client = new ssrp.Client(_.I, _.p, _.ng_type, _.hash_type);
        },
        teardown: function() {
            _.client = null;
        }
    });


    test('client init', function() {
        equal(_.client.I, _.I);

        //prevent write
        _.client.I = 1;
        equal(_.client.I, _.I);
    });

    test('init with incorect arguments', function() {
        throws(function() {
            var client = new ssrp.Client();
        });
        throws(function() {
            var client = new ssrp.Client('login');
        });
        throws(function() {
            var client = new ssrp.Client('login', 'password', 'ng');
        });
        throws(function() {
            var client = new ssrp.Client('login', 'password', 'ng', 'sha');
        });
    });

    test('default client arguments', function() {
        var client = new ssrp.Client('test', 'test');
        equal(client.$ng, '1024');
        equal(client.N.toString(16), ssrp.NGS['1024'].N.toLowerCase());
        equal(client.$hash, 'sha1');
        equal(client.g.toString(16), ssrp.NGS['1024'].g.toLowerCase());
        equal(client.k.toString(16), '28d657fb7a40707b0bbed5929c1ca2a7b2531095');

    });


    test('generate salt: randomSalt()', function() {
        var buff = [],
            salt;
        for (var i = 0; i < 10; i++) {
            salt = _.client.randomSalt();
            equal(buff.indexOf(salt), -1, 'Not unique salt: ' + salt);
            buff.push(salt);
        }
    });

    test('generate random big number: randomNumber()', function() {
        ok(_.client.randomNumber() instanceof BigInteger, 'Expect BigInteger object');
        var buff = [],
            rand;
        for (var i = 0; i < 10; i++) {
            rand = _.client.randomNumber().toString();
            equal(buff.indexOf(rand), -1, 'Not unique random number: ' + rand);
            buff.push(rand);
        }
    });

    test('generate hash()', function() {
        equal(_.client.hash('test'), 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3', 'Incorect hash for key: test');
    });

    test('verification()', function() {
        var res = _.client.verification('5888575940181172001');
        equal(res.v.toString(), '137160747239038803334312815258876238010504398786561568261851481649526880931927337588322079317786542093933949301115457723596754277770002264679772272158360187049179369280298665116131929490797332205911630099572916583896936799098229503290231486969479270759814347182059166295577462752735531908328364330448773732538')
        equal(res.salt, '5888575940181172001');
    });

    test('authentication()', function() {
        throws(function(){
            _.client.authentication('5888575940181172001');
        });
        var A = _.client.authentication(new BigInteger('11'));
        equal(A.toString(), '2048');
    });

})();
