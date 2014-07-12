(function() {


    module('require');
    test('hash sha1', function() {
        equal(ssrp.hash.sha1('test'), 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
    });
    test('hash sha512', function() {
        equal(ssrp.hash.sha512('test'), 'ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff');
    });
    test('BitInteger', function() {
        var num = new BigInteger('123456');
        equal(num.toString(), '123456');

        var num = new BigInteger('ff', 16);
        equal(num.toString(), '255');

        var num = new BigInteger('255');
        equal(num.toString(16), 'ff');
    });




    module('ssrp', {
        setup: function() {

            this.I = 'user';
            this.p = 'password';
            this.ng_type = '2024';
            this.hash_type = 'sha1'

            this.client = new ssrp.Client(this.I, this.p, this.ng_type, this.hash_type);
        },
        teardown: function() {
            this.client = null;
        }
    });


    test('client init', function() {
        equal(this.client.I, this.I);

        //prevent writable
        this.client.I = 1;
        equal(this.client.I, this.I);
    });

    test('create verification', function() {
        var v = this.client.verification('5888575940181172001');
        equal(this.client.x, '229262074488244325230961648942372972863449427587')
        equal(v, '19873846808690855440415823956006681328865575524066805930658210668205655064114810146102409275948371383572871316557371293135141340083883181632269635902710237335598474664245685365638909369243424335182087070029493922375132749942851579613716188571563574675617067256236981079393301503441208081882845298352710210181821971964077681174775379330968599394132164824291718278275027310099444341771919047441907907671799625151239084252944862394889084023193159449036119557924403291942211956346695397552569681707666447436329297025916480960935770019549602930657870145470039740881828857336712225479476400016421439531126515780307884405506');

    });

})();
