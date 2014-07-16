var send = function(type, url, data, callback){
            type = type.toLowerCase()
            var query = [];
            for(var i in data){
                query.push(encodeURIComponent(i)+'='+encodeURIComponent(data[i]));
            }
            query = query.join('&');

            var xhr = new XMLHttpRequest();
            xhr.onload = function(){
                if(xhr.getResponseHeader('Content-Type').indexOf('application/json') === 0){
                    callback(JSON.parse(xhr.responseText));
                }else{
                    callback(xhr.responseText);
                }
                
            };

            xhr.open(type, url, true);
            if(type === 'post'){
                xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded; charset=UTF-8');
            }
            xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
            xhr.send(query);
        };
        var $ = function(s, ctx){
            return (ctx || document).querySelector(s);
        };
        var $$ = function(s, ctx){
            return (ctx || document).document.querySelectorAll(s);
        };