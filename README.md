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

Install gulp, bower and typings

```
npm install -g gulp typings bower
```

Install the package dev deps

```
npm install
```

Install the bower deps

```
bower install
```

Install typings type files

````
typings install
```

Build the WebUI in the dist subdirectory

```
gulp build
```

Or test the app

```
gulp serve
```
