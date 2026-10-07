const os = require("os");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, {recursive: true});
}

const joinedPath = path.join(sampleFilesDir, "folder", "file.txt");
// OS module
console.log(`Platform: ${os.platform()}`);
console.log(`CPU: ${os.cpus()[0].model}`);
console.log(`Total Memory: ${os.totalmem()}`);

// Path module
console.log(`Joined path:  ${joinedPath}`);
// fs.promises API

(async function main() {
  try {
    await fsPromises.writeFile(
      path.join(sampleFilesDir, "demo.txt"),
      "Hello from fs.promises!"
    );
    console.log(
      `fs.promises read: ${await fsPromises.readFile(path.join(sampleFilesDir, "demo.txt"), "utf8")}`
    );
  } catch (err) {
    console.error(err);
  }
})();
// Streams for large files- log first 40 chars of each chunk

(async function stream() {
  let text = "";
  let lineCount = 1;
  while (lineCount < 101) {
    text += `This is line ${lineCount} in a large file...\n`;
    lineCount++;
  }
  try {
    await fsPromises.writeFile(
      path.join(sampleFilesDir, "largefile.txt"),
      text
    );

    const reader = fs.createReadStream(
      path.join(sampleFilesDir, "largefile.txt"),
      {
        
        encoding: "utf8",
        highWaterMark: 1024
      }
    );
    reader.on("data", (chunk) => {
      console.log(`Read chunk: ${chunk.slice(0,40)}`);
    });
    reader.on("end", () => {
      console.log("Finished reading large file with streams.");
    });
    reader.on("error", (err) => {
      console.log("error reading stream",err);
    });
  } catch (err) {
    console.error(err);
  }
})();
