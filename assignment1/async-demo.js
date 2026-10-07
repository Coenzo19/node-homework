const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "sample-files/sample.txt");
// Write a sample file for demonstration
fs.writeFile(file, "Hello, async world!", (err) => {
  if (err) {
    console.error(err);
    return;
  }
  // 1. Callback style
  fs.readFile(file, "utf8", (err, content) => {
    if (err) {
      console.log(err.message);
      return;
    }
    console.log(`callback: ${content}`);
  });

  // Callback hell example (test and leave it in comments):
  //   fs.readFile('file1.txt', (err, data1) => {
  //   if (err) throw err;
  //   fs.readFile('file2.txt', (err, data2) => {
  //     if (err) throw err;
  //     fs.readFile('file3.txt', (err, data3) => {
  //       if (err) throw err;
  //       // Use data1, data2, and data3
  //     });
  //   });
  // });

  // 2. Promise style
  function promiseStyle(pathing) {
    return new Promise((resolve, reject) => {
      fs.readFile(pathing, "utf8", (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  promiseStyle(file)
    .then((data) => console.log(`promise: ${data}`))
    .catch((err) => console.error("Error reading file:", err));

  // 3. Async/Await style

  async function getData() {
    try {
      const result = await promiseStyle(file);
      console.log(`async/await: ${result}`);
    } catch (err) {
      console.log(err);
    }
  }
  getData();
});
