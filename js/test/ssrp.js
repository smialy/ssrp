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
        //reguire BigInteger or none
        throws(function() {
            _.client.authentication('5888575940181172001');
        });
        var result = _.client.authentication(new BigInteger('11'));
        equal(result.a.toString(), '11');
        equal(result.A.toString(), '2048');

    });

    test('processChallenge()', function() {

        var salt = '12745053004094739078';
        var a = new BigInteger('69275124270983666941742803396031841287203748385939936261865032349777417294415868071382989360982008826046622821373136248535263845188733972851659627900566825811340564028162923992689849596580343326353695055202147818018702268395168472308268833121848774171778255191201761589822773879382145295131892445071660179263');
        var A = new BigInteger('76071616000165468263771587728291707215186005263091645397725715424202748900445293078171347607974047386800107887932960429171158036420385377912873769964113548917811011698435939285806971645902849957604004282604632073819619486415991539766634521401796863466328902681737852733158533643493784894205882333463607713641');
        var B = new BigInteger('48593600238352599017432383500893156144674515763923725295115032237159668110786375983359049577964208636875855276277663764805414029586896124773068287736353556161293429186699538056856917995098984972036431402252181800242402092990336058948150931242459756035981184648266866600099337946947272844365447199683646432631');

        var result = _.client.processChallenge(salt, a, A, B);

        equal(result.S.toString(), '120027068010707863293812273060585462203933750120513836982426096096222976640246371763040861914980556146401774069757640955714310725219040595759265774490494789349859262596166771817331919408267685868532037796424537366128399227334460004373229470657566581292505893834564217355907514231110900665672686449868625662178');
        equal(result.M.toString(), '167852578309203367068901232240885638880965452733');
        equal(result.K.toString(), '871073768713167765695186133679992583097781041039');
    });

})();
