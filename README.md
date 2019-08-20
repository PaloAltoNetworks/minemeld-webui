# minemeld-webui
WebUI for minemeld

## BUILDING

### Requirements

Not strictly required but suggested:

- virtualenv (https://pypi.python.org/pypi/virtualenv)
- nodeenv (https://github.com/ekalinin/nodeenv)

### Procedure

Setup a virtual node env and activate it

```
nodeenv -v -n 0.12.2 --npm=2.14.7 --prebuilt -c venv
. ./venv/bin/activate
```

Clone the repo

```
git clone https://github.com/PaloAltoNetworks/minemeld-webui.git
cd minemeld-webui
```

Install the package dev deps

```
npm install
```

Add local node modules to the PATH

```
export PATH=$(npm bin):$PATH
```

Install the bower deps

```
bower install
```

Install typings type files

```
typings install
```

Check for known security issues on node packages

```
nsp check
```

Build the WebUI in the dist subdirectory

```
gulp build
```

## TESTING

Use the following command to serve and test your local version of the WebUI during development:

```
gulp serve --url https://<IP of MineMeld VM>
```
