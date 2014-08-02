$login = $('#login-box');
        $('button', $login).addEventListener('click',function(e){
            var login = $('input[name="login"]', $login).value.trim();
            var password = $('input[name="password"]', $login).value.trim();
         
            if(password.length && login.length){
                var client = new ssrp.Client(login, password, ssrp.NG_2048);
                
                var auth = client.authentication();
                var A = auth.A;
                var a = auth.a;
                send('post', '/handshake', {login:login, a:A.toString()}, function(req){
                    if(req.error){
                        alert(req.message);
                    }else{
                        var B = new BigInteger(req.b);
                        var challenge = client.processChallenge(req.salt, a, A, B);
                        send('post','/authenticate',{login:login, m:challenge.M.toString(), a:A.toString()}, function(req){
                            if(req.error){
                                alert(req.message);
                            }else{
                                location.href = '/';
                            }
                        });
                    }
                });
            }
            
        },false);