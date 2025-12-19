from setuptools import setup, find_packages

setup(
    name="embedded32",
    version="1.0.0",
    description="J1939 client library for interacting with Embedded32 platform",
    author="Mukesh Mani Tripathi",
    author_email="",
    license="MIT",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[],  # No dependencies for virtual transport
    extras_require={
        "socketcan": ["python-can>=4.0.0"],
        "dev": [
            "pytest>=7.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
        ]
    },
    keywords=["j1939", "can", "automotive", "vehicle", "embedded32"],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
