import os
import sys
import traceback

import ssrp

from flask import Flask, render_template, request, redirect, jsonify, session
from flask.ext.login import LoginManager, login_required, login_user, logout_user

ROOT = os.path.dirname(os.path.realpath(__file__))
TEMPLATES = os.path.join(ROOT, 'demo', 'templates')
STATIC = os.path.join(ROOT, 'demo', 'static')

app = Flask(__name__, template_folder=TEMPLATES, static_folder=STATIC)
app.debug = True
app.secret_key = 'test :P'

login_manager = LoginManager(app)




class User:
    def __init__(self, login, salt, v):
        self.login = login
        self.v = v
        self.salt = salt

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.login

    def to_dict(self):
        return dict(login=self.login)


users = []

def get_user(login):
    for user in users:
        if user.login == login:
            return user
    return None


@login_manager.user_loader
def load_user(userid):
    return get_user(userid)


@login_manager.unauthorized_handler
def unauthorized():
    return redirect('/login')


@app.route("/")
@login_required
def hello():
    return render_template('index.html')


@app.route('/login')
def login():
    return render_template('login.html')


@app.route("/handshake", methods=['GET', 'POST'])
def handshake():
    try:
        user = get_user(request.form['login'])
        if user:
            A = request.form['a']
            svr = ssrp.Server(user.login, user.salt, int(user.v), int(A))
            salt, B = svr.challenge()
            session['srp'] = (svr.K, svr.M)
            if salt is None or B is None:
                return jsonify(error=True, message="Authentication failed")
            return jsonify(error=False, salt=salt, b=str(B))
        return jsonify(error=True, message="Not found user")
    except:
        exceptionType, exceptionValue, exceptionTraceback = sys.exc_info()
        traceback.print_tb(exceptionTraceback)
        return jsonify(error=True, message="Internal error")


@app.route('/authenticate', methods=['POST'])
def authenticate():
    user = get_user(request.form['login'])
    if user:
        _M = request.form['m']
        srp = session.pop('srp', None)
        if srp:
            K, M = srp
            if _M == str(M):
                login_user(user)
                return jsonify(error=False)

    return jsonify(error=True, message="Incorect session")



@app.route("/registration", methods=['POST', 'GET'])
def registration():
    if request.method == 'POST':
        login = request.form['login']
        if get_user(login) is not None:
            return jsonify(dict(error=True, message="User exits"))
        salt = request.form['salt']
        v = request.form['v']

        user = User(login, salt, v)
        users.append(user)
        return jsonify(dict(error=False, user=user.to_dict()))
    else:
        return render_template('registration.html')


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect('/')

if __name__ == "__main__":
    app.run()
