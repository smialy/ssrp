
        $reg = $('#register-box');
        $('button' , $reg).addEventListener('click',function(e){
            console.log(e);
            var login = $('input[name="login"]',$reg).value.trim();
            var password = $('input[name="password"]',$reg).value.trim();
            var repassword = $('input[name="password_repeat"]',$reg).value.trim();
            if(password.length && password === repassword && login.length){
                var client = new ssrp.Client(login, password, ssrp.NG_2048);
                var verification = client.verification();
                send('post', '/registration', {login:login,salt:verification.salt,v:verification.v}, function(req){
                    if(req.error){
                        alert(req.message);
                    }else{
                        location.href = '/login';
                    }

                });
            }

        },false);