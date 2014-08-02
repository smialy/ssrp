import sys
import traceback

import ssrp
import model

from flask import Flask, render_template, request, redirect, jsonify, session
from flask.ext.login import LoginManager, login_required, login_user, logout_user, current_user


app = Flask(__name__)
app.debug = True
app.secret_key = 'test :P'

login_manager = LoginManager(app)
login_manager.session_protection = "strong"


@login_manager.user_loader
def load_user(userid):
    user = model.find_user(userid)
    if user:
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
    user = model.get_user(request.form['login'])
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
        user = model.get_user(request.form['login'])
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
        
        if model.has_user(login):
            return jsonify(dict(error=True, message="User exits"))
        
        model.add_user(login, salt, v)
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
    app.run(port=8000)
