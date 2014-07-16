import sys
import traceback

import ssrp

from flask import Flask, render_template, request, redirect, jsonify, session
from flask.ext.login import LoginManager, login_required, login_user, logout_user, current_user


app = Flask(__name__)
app.debug = True
app.secret_key = 'test :P'

login_manager = LoginManager(app)
login_manager.session_protection = "strong"

users = [];

class SRP():
    def __init__(self, salt, v):
        self.salt = salt
        self.v = v

class User():
    def __init__(self, login, srp):
        self._login = login
        self._authenticated = False;
        self._srp = srp

    def get_id(self):
        print('User.get_id()', self._login)
        return self._login;

    def is_anonymous(self):
        print('User.is_anonymous()')
        return not self._authenticated

    def is_active(self):
        print('User.is_active()')
        return True

    def is_authenticated(self):
        print('User.is_authenticated()',self.authenticated)
        return self.authenticated
    
    @property
    def salt(self):
        return self._srp.salt

    @property
    def v(self):
        return self._srp.v

    @property
    def login(self):
        return self._login
    
    @property
    def authenticated(self):
        return self._authenticated

    @authenticated.setter
    def authenticated(self, value):
        print('User.authenticated.setter',value)
        self._authenticated = bool(value)


def get_user(login):
    for user in users:
        if user.login == login:
            return user
    return None    

def has_user(login):
    for user in users:
        if user.login == login:
            return True
    return False


@login_manager.user_loader
def load_user(userid):
    for user in users:
        if user.get_id() == userid:
            return user


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
            K, M = srp
            if _M == str(M):
                user.authenticated = True
                login_user(user)
                return jsonify(error=False);
    
    return jsonify(error=True, message="Incorect session");



@app.route("/handshake", methods=['GET','POST'])
def handshake():
    try:
        user = get_user(request.form['login'])
        if user:
            A = request.form['a']
            svr = ssrp.Server(user.login, user.salt, int(user.v), int(A));
            salt, B = svr.challenge()
            session['srp'] = (svr.K, svr.M)
            if salt is None or B is None:
                return jsonify(error=True, message="Authentication failed");
            return jsonify(error=False, salt=salt, b=str(B));
        return jsonify(error=True, message="Not found user");
    except:
        exceptionType, exceptionValue, exceptionTraceback = sys.exc_info()
        print(exceptionType, exceptionValue)
        traceback.print_tb(exceptionTraceback)
        return jsonify(error=True, message="Internal error");

@app.route("/registration", methods=['POST', 'GET'])
def registration():
    if request.method == 'POST':
        login = request.form['login']
        salt = request.form['salt']
        v = request.form['v']
        
        if has_user(login):
            return jsonify(dict(error=True, message="User exits"))
        
        user = User(login, SRP(salt, v))
        users.append(user)
        return jsonify(dict(error=False))
    else:
        return render_template('registration.html')

@app.route("/logout")
@login_required
def logout():
    current_user.authenticated = False
    logout_user()
    return redirect('/')

if __name__ == "__main__":
    app.run()
