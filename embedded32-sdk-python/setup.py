from setuptools import setup, find_packages

setup(
    name="embedded32-sdk-python",
    version="0.1.0",
    description="Python SDK for Embedded32 platform - scripting, testing, and automation",
    author="Mukesh Mani Tripathi",
    author_email="",
    license="MIT",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "python-can>=4.0.0",
        "paho-mqtt>=1.6.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
        ]
    },
    keywords=["embedded", "can", "j1939", "automotive", "embedded32"],
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
