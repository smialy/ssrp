import unittest

from . import TestCase
import ssrp

class ClientTestCase(TestCase):
    def setup(self):
        self.client = ssrp.Client('loging', 'password', ssrp.NG_1024)

    def teardown(self):
        self.client = None

    def test_verifier(self):
        salt, v = self.client.verifier('some salt')
        self.assert_equal('some salt', salt)
        self.assert_equal('v', v)


class ServerTestcase(TestCase):
    def setup(self):
        pass

    def teardown(self):
        pass

def suite():
    unittest.main()

if __name__ == '__main__':
    suite()