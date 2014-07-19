from setuptools import setup

setup(
    name='SSRP3',
    version='1.0',
    url='http://github.com/smialy/ssrp3',
    license='MIT',
    author='Piotr Smialkowski',
    descriptiom='Secure Remote Password protocol (SRP)',
    packages='ssrp3',
    platforms='any',
    classifiers=[
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Topic :: Internet :: WWW/HTTP :: Browsers',
        'Topic :: Security',
        'Topic :: Security :: Cryptography',
    ],
    test_suite='ssr3.tests.suite'
)
