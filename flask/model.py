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

def find_user(_id):
    for user in users:
        if user.get_id() == _id:
            return user
    return None

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

def add_user(login, salt, v):
    users.append(User(login, SRP(salt, v)))