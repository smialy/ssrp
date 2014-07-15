(function(ssrp) {

    if (typeof BigInteger === 'undefined') {
        throw {
            message: 'Require: BigInteger'
        };
    }

    /**
     * Client
     *
     * @constructor
     * @param {String} username
     * @param {String} password
     * @param {String} ngType (default: 1024)
     * @param {String} hashType (defult: sha1)
     */
    ssrp.Client = function(username, password, ngType, hashType) {

        if (!username) {
            throw {
                type: 'InvalidArgument',
                message: 'Username cannot be empty.'
            };
        }
        if (!password) {
            throw {
                type: 'InvalidArgument',
                message: 'Passwrod cannot be empty.'
            };
        }

        ngType = ngType || '1024';
        hashType = hashType || 'sha1';

        if (!NGS.hasOwnProperty(ngType)) {
            throw {
                type: 'InvalidArgument',
                message: 'Not found NG type: ' + ngType + ' [' + Object.keys(NGS).join(', ') + ']'
            };
        }
        if (!HASH.hasOwnProperty(hashType)) {
            throw {
                type: 'InvalidArgument',
                message: 'Not found hash type: ' + hashType
            };
        }

        Object.defineProperties(this, {
            $ng: {
                value: ngType,
                writable: false
            },
            $hash: {
                value: hashType,
                writable: false
            }
        });

        var NG = NGS[ngType];
        var N = new BigInteger(NG.N, 16);
        var g = new BigInteger(NG.g, 16);
        var k = this.$h(N, g);

        Object.defineProperties(this, {
            I: {
                value: username,
                writable: false
            },
            p: {
                value: password,
                writable: false
            },
            N: {
                value: N,
                writable: false
            },
            g: {
                value: g,
                writable: false
            },
            k: {
                value: k,
                writable: false
            }
        });
    };

    ssrp.Client.prototype = {

        /**
         * Calculate verification code [v = g^x % N]
         *
         * @param {String} salt (optional)
         * @return {BigInteger}
         */
        verification: function(salt) {
            if (!salt) {
                salt = this.randomSalt();
            }
            var x = this._calculateX(salt);
            var v = this.g.modPow(x, this.N);
            return {
                salt: salt,
                v: v
            };
        },
        /**
         *
         * @param {BigInteger} a
         * @return {BigInteger}
         */
        authentication: function(a) {
            if (!a) {
                a = this.randomNumber();
            }
            if (!(a instanceof BigInteger)) {
                throw {
                    type: 'InvalidArgument',
                    message: 'Expected BigInteger'
                };
            }

            var A = this.g.modPow(a, this.N);
            if (A.mod(this.N).toString() === '0') {
                throw {
                    type: 'UnexpectedValue',
                    mesage: 'Illegal: A'
                };
            }
            return {
                A: A,
                a: a
            };
        },
        processChallenge: function(salt, a, A, B) {
            if (!salt) {
                throw {
                    type: 'InvalidArgument',
                    message: 'Missing argument: "salt"'
                };
            }
            if (!a) {
                throw {
                    type: 'InvalidArgument',
                    message: 'Missing argument: "a"'
                };
            }
            if (!(A instanceof BigInteger && B instanceof BigInteger) || A.mod(this.N).toString() === '0' || B.mod(this.N).toString() === '0') {
                throw {
                    type: 'InvalidArgument',
                    message: 'Require A and B as BigInteger and different from zero'
                };
            }

            var u = this.$h(A, B);
            var x = this._calculateX(salt);

            //bx = g^x % N
            var bx = this.g.modPow(x, this.N);

            //(B - kg^x) ^ (a + ux)
            var S = B.subtract((this.k.multiply(bx))).modPow(a.add(u.multiply(x)), this.N);
            var K = new BigInteger(this.hash(S.toString()), 16);
            var M = this.$h(A, B, K);
            return {
                M: M,
                K: K,
                S: S
            };
        },
        /**
         * Hash given arguments
         *
         * @return {BigInteger}
         */
        $h: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i].toString());
            }
            return new BigInteger(this.hash(args.join(':')), 16);
        },
        /**
         * Make hash
         *
         * @return {String}
         */
        hash: function(s) {
            return HASH[this.$hash](s);
        },
        /**
         * Generate random string
         *
         * @return {String}
         */
        randomSalt: function() {
            var words = sjcl.random.randomWords(4, 0);
            return sjcl.codec.hex.fromBits(words);
        },
        /**
         * Generate random big number
         *
         * @return {BigInteger}
         */
        randomNumber: function() {
            var words = sjcl.random.randomWords(4, 0);
            var hex = sjcl.codec.hex.fromBits(words);
            return new BigInteger(hex, 16);
        },
        /**
         * Calculate X [x = hash(s | hash(I | ":" | P))]
         *
         * @param {String} salt
         */
        _calculateX: function(salt) {
            var X = this.hash(salt + ':' + this.hash(this.I + ":" + this.p));
            return new BigInteger(X, 16);

        }

    };

    var HASH = {
        sha1: function(str) {
            var hash = new jsSHA(str, "TEXT");
            return hash.getHash("SHA-1", "HEX");
        },
        sha512: function(str) {
            var hash = new jsSHA(str, "TEXT");
            return hash.getHash("SHA-512", "HEX");
        }
    };

    var NGS = {

        1024: {
            N: 'EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C' +
                '9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE4' +
                '8E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B29' +
                '7BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9A' +
                'FD5138FE8376435B9FC61D2FC0EB06E3',
            g: '2'

        },

        2048: {
            N: 'AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC319294' +
                '3DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310D' +
                'CD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FB' +
                'D5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF74' +
                '7359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A' +
                '436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D' +
                '5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E73' +
                '03CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB6' +
                '94B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F' +
                '9E4AFF73',
            g: '2'
        },

        4096: {
            N: 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E08' +
                '8A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B' +
                '302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9' +
                'A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE6' +
                '49286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8' +
                'FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
                '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C' +
                '180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF695581718' +
                '3995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D' +
                '04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7D' +
                'B3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D226' +
                '1AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200C' +
                'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFC' +
                'E0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B26' +
                '99C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB' +
                '04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2' +
                '233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127' +
                'D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199' +
                'FFFFFFFFFFFFFFFF',
            g: '5'
        },

        8192: {
            N: 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E08' +
                '8A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B' +
                '302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9' +
                'A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE6' +
                '49286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8' +
                'FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
                '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C' +
                '180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF695581718' +
                '3995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D' +
                '04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7D' +
                'B3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D226' +
                '1AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200C' +
                'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFC' +
                'E0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B26' +
                '99C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB' +
                '04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2' +
                '233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127' +
                'D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934028492' +
                '36C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406' +
                'AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918' +
                'DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B33205151' +
                '2BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03' +
                'F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97F' +
                'BEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AA' +
                'CC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58B' +
                'B7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632' +
                '387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E' +
                '6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA' +
                '3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C' +
                '5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD9' +
                '22222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC886' +
                '2F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A6' +
                '6D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC5' +
                '0846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268' +
                '359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6' +
                'FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E71' +
                '60C980DD98EDD3DFFFFFFFFFFFFFFFFF',
            g: '19'
        }

    };
    ssrp.HASH = HASH;
    ssrp.NGS = NGS;

})(window.ssrp = {});
