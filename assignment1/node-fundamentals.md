# Node.js Fundamentals

## What is Node.js?
a runtime that runs javascript outside of the browser

## How does Node.js differ from running JavaScript in the browser?
Node allows us to use javascript to read/write files,start a server,access operationg system operations,read environmental variables and process client side request from a server

## What is the V8 engine, and how does Node use it?
an engine inside Node that allows javascript to run outside the browser and execute code

## What are some key use cases for Node.js?
Node lets us use javascript to perform backend tasks like starting a server,read/write files/work with environmental variables and provides operations thatinteract with the operating system

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
The difference is syntax.Common uses require() to store a pathway to a file and destructure functions/values for use inside the file. module.exports takes data/functions from the file to give access to other files that require it.

const {add,multipy} =require('./pathway')
{add,multiple}=module.exports;
```

**ES Modules (supported in modern Node.js):**
```js
we import the tools we want from the file by using it's path and destructuring  the tools after import.
import { useState, useEffect } from "react";
``` 