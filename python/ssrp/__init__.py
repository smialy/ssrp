import hashlib
import random

import nums


NG_1024 = 0
NG_2048 = 1
NG_4096 = 2
NG_8192 = 3

SHA1 = hashlib.sha1
SHA512 = hashlib.sha512

def pr(name, value):
    print(name, str(value)[:50])


def HH(hashtype):  # a one-way hash function
    def h(*a):
        a = ':'.join([str(a) for a in a])
        return int(hashtype(a.encode('ascii')).hexdigest(), 16)    
    return h


def cryptrand(N, n=1024):
    return random.SystemRandom().getrandbits(n) % N


class Client():
    def __init__(self, login, password, ng_type=NG_2048, hash_type=SHA1):
        
        self._H = HH(hash_type)
        self.I = login
        self.p = password
        self.N, self.g = nums.get_ng(ng_type)
        self.k = self._H(self.N, self.g)
    
    def verifier(self, salt=None):
        if salt is None:
            salt = cryptrand(self.N, 64)
        x = self._H(salt, self.I, self.p)
        v = pow(self.g, x, self.N)
        return salt, v
    
    def authentication(self):
        self.a = cryptrand(self.N)
        self.A = pow(self.g, self.a, self.N)
        return self.A

    def process_challenge(self, salt, B):
        u = self._H(self.A, B)
        x = self._H(salt, self.I, self.p)

        S = pow(B - self.k * pow(self.g, x, self.N), self.a + u * x, self.N)
        self.K = self._H(S)
        
        return self._H(self.A, B, self.K)

class Server():
    def __init__(self, I, salt, v, A, ng_type=NG_2048, hash_type=SHA1):

        self._H = HH(hash_type)

        self.I = I
        self.salt = salt

        N, g = nums.get_ng(ng_type)
        self.k = self._H(N, g)

        self.v = v
        self.A = A

        b = cryptrand(N)
        self.B = (self.k * v + pow(g, b, N)) % N

        u = self._H(A, self.B)

        S = pow(A * pow(v, u, N), b, N)
        self.K = self._H(S)
        self.M = self._H(A, self.B, self.K)

    def challenge(self):
        return self.salt, self.B

    def verify_session(self, M):
        if M == self.M:
            return self._H(self.A, M, self.K)
        return None

if __name__ == '__main__':
    I, p = 'a','a'

    client = Client(I, p)
    pr('client.g', client.g)
    pr('client.N', client.N)
    pr('client.k', client.k)
    salt, v = client.verifier()
    pr('client.salt',salt)
    pr('client.v', v)

    A = client.authentication()

    pr('client.A',A)
    server = Server(I, salt, v, A)
    _salt, B = server.challenge()

    assert _salt == salt

    pr('server.K', server.K)
    pr('server.B', B)

    M = client.process_challenge(salt, B)
    pr('client.K', client.K)

    pr('verify_session', server.verify_session(M))








