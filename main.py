import sys
import traceback

import ssrp

from flask import Flask, render_template, request, redirect, jsonify, session
from flask.ext.login import LoginManager, login_required, logout_user


app = Flask(__name__)
app.debug = True
app.secret_key = 'test :P'

login_manager = LoginManager(app)

users = [];

@login_manager.user_loader
def load_user(userid):
    return None	

@login_manager.unauthorized_handler
def unauthorized():
    # do stuff
    return redirect('/login')


@app.route("/")
@login_required
def hello():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/authenticate', methods=['POST'])
def authenticate():
    user = get_user(request.form['login'])
    if user:
        _M = request.form['m']
        srp = session.pop('srp', None)
        if srp:
            A, B, K, M = srp
            if _M == str(M):
                return jsonify(error=False);
    
    return jsonify(error=True, message="Incorect session");


def get_user(login):
    for user in users:
        if user['login'] == login:
            return user
    return None    


@app.route("/handshake", methods=['GET','POST'])
def handshake():
    try:
        user = get_user(request.form['login'])
        if user:
            A = request.form['a']
            svr = ssrp.Server(user['login'], user['salt'], int(user['v']), int(A));
            salt, B = svr.challenge()
            session['srp'] = (A, B, svr.K, svr.M)
            if salt is None or B is None:
                return jsonify(error=True, message="Authentication failed");
            return jsonify(error=False, salt=salt, b=str(B));
        return jsonify(error=True, message="Not found user");
    except:
        exceptionType, exceptionValue, exceptionTraceback = sys.exc_info()
        traceback.print_tb(exceptionTraceback)
        return jsonify(error=True, message="Internal error");

@app.route("/registration", methods=['POST', 'GET'])
def registration():
    if request.method == 'POST':
        login = request.form['login']
        _p = request.form['_p']
        salt = request.form['salt']
        v = request.form['v']
        
        for user in users:
            if user['login'] == login:
                return jsonify(dict(error=True, message="User exits"))
        
        user = dict(login=login, salt=salt, v=v)
        users.append(user)
        return jsonify(dict(error=False, user=user))
    else:
        return render_template('registration.html')

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(somewhere)

if __name__ == "__main__":
    app.run()
