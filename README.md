Treat local, FTP and SFTP files the same way.
*100% Node.js*, no other software needed.

Visit the Project on GitHub [https://github.com/Mylogo/ftp-sftp](https://github.com/Mylogo/ftp-sftp)
Example FTP/SFTP Client using this library: [https://github.com/Mylogo/
ftp-sftp-example](https://github.com/Mylogo/ftp-sftp-example)
# Contents
* [Installation](#installation)
* [Overview](#overview)
* [API](#api)
* [Examples](#examples)

## Installation

    npm i ftp-sftp

## Overview
class hierarchy
```js
class FileSystem;
  class LocalFileSystem extends FileSystem;
  class FtpFileSystem extends FileSystem;
  class SftpFileSystem extends FileSystem;

class FileInfo;
```

### Instantiate a FileSystem
```js
const localFileSystem = new LocalFileSystem();
const ftpFileSystem = await FtpFileSystem.create(host, port, user, password);
const sftpFileSystem = await SftpFileSystem.create(host, port, user, password);
```

## API

### FileSystem
```js
// Returns the directory content. See FileInfo below
list(path: string): Promise<FileInfo[]>;

// Inserts a file from a stream. You can get one from get()
put(src: NodeJS.ReadableStream, toPath: string): Promise<any>;

// Gets a file stream. Can be inserted into put()
get(path: string): Promise<NodeJS.ReadableStream>;

// Creates a directory. recursive=true will also create subdirectories
mkdir(path: string, recursive: boolean): Promise<any>;

// Deletes a directory. recursive=true will also delete subdirectories
rmdir(path: string, recursive: boolean): Promise<any>;

// Deletes a file
delete(path: string): Promise<any>;

// Can be used to move a file or just to rename it
rename(oldPath: string, newPath: string): Promise<any>;
```

### FileInfo
```js
// Gets the file name (does not include path)
getName(): string

// Gets the file size
getSize(): number

// returns true if it's a directory, false otherwise
isDirectory(): boolean
```

## Examples
```js
// constants for all examples
const host = '127.0.0.1';
const port = 21; // or 22 for SFTP
const user = 'root';
const password = 'password';
```
### Listing items inside a directory
_using Promise/then/catch_
```js
// You could just replace FtpFileSystem with SftpFileSystem for SFTP instead of FTP
FtpFileSystem.create(host, port, user, password)
// Or: SftpFileSystem.create(host, port, user, password)
  .then(ftpFileSystem => {
    // List remote files
    ftpFileSystem.list('/home')
      .then(files => {
        console.log("Files:", files);
      }).catch(err => {
        console.log("Could not retrieve directory  /home", err);
      })
  }).catch(err => {
    console.log("Error while connecting to FTP server:", err);
  });
```
_using Promise/then/catch_
### Upload file from local file system
```js
var localFileSystem = new LocalFileSystem();

SftpFileSystem.create(host, port, user, password)
// Or: FtpFileSystem.create(host, port, user, password)
  .then(sftpFileSystem => {
    // Get the local file as a stream
    localFileSystem.get('/Users/dennis/catpic.jpeg')
      .then(readStream => {
        // Now, upload the file to the SFTP server
        sftpFileSystem.put('/home/uploaded_catpic.jpeg', readStream)
          .then(() => {
            console.log("Important file was uploaded successfully, meow!")
          })
      })
  }).catch(err => {
    console.log("Error while uploading file:", err);
  });
```

### Transfer file from FTP server to another SFTP server
_using await_
```js
const ftpFileSystem = await FtpFileSystem.create(host, port, user, password);
const sftpFileSystem = await SftpFileSystem.create(hort, port, user, password);

const readStream = await ftpFileSystem.get('/home/catpic.jpeg');
await sftpFileSystem.put(readStream, '/var/catpic.jpeg');

```

### Create and delete directory
_using await_
```js
const ftpFileSystem = await FtpFileSystem.create(host, port, user, password);

// Create the directory
await ftpFileSystem.mkdir('/home/catpics');

// Create directory and sub-directories (recursively: true)
await ftpFileSystem.mkdir('/home/even/more/catpics', true);


// Delete the newly created directory (Only works on empty directories)
await ftpFileSystem.rmdir('/home/catpics');

// Delete directory with content (recursively: true)
await ftpFileSystem.rmdir('/home/even/more/catpics', true);
```