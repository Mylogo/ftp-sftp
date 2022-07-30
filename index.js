const nodeFs = require('fs')
const nodePath = require('path');

const FtpClient = require('ftp')
const SftpClient = require('ssh2-sftp-client');

class FileSystem {

}

class FileInfo {
  constructor(original) {
    this.original = original
  }
  getName() {
    return this.original.name
  }
  getSize() {
    return this.original.size
  }
}

// credits going to https://geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
var deleteFolderRecursive = function(path) {
  if( nodeFs.existsSync(path) ) {
    nodeFs.readdirSync(path).forEach(function(file,index){
      var curPath = nodePath.join(path, file);
      if(nodeFs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        nodeFs.unlinkSync(curPath);
      }
    });
    nodeFs.rmdirSync(path);
  }
};

class LocalFileSystem extends FileSystem {
  constructor() {
    super()
  }
  static create() {
    return new Promise((resolve, reject) => {
      return resolve(new LocalFileSystem())
    })
  }
  async list(path) {
    return new Promise((resolve, reject) => {
      nodeFs.readdir(path, async (err, files) => {
        if (err) {
          return reject(err)
        }
        await Promise.all(
          files.map(fileName => new Promise((res, reject) => {
            nodeFs.stat(nodePath.join(path, fileName), (err, stats) => {
              if (err) {
                return reject(err)
              }
              stats.name = fileName
              res(new LocalFileInfo(stats))
            })
          }))
        ).then(res => {
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      })
    })
  }
  put(src, toPath) {
    return new Promise((resolve, reject) => {
      try {
        const writeStream = nodeFs.createWriteStream(toPath)
        src.pipe(writeStream)
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }
  get(path) {
    return new Promise((resolve, reject) => {
      try {
        const readStream = nodeFs.createReadStream(path)
        resolve(readStream)
      } catch (e) {
        reject(e)
      }
    })
  }
  mkdir(path, recursive) {
    return nodeFs.mkdir(path, { recursive })
  }
  rmdir(path, recursive) {
    if (!recursive)
      return nodeFs.rmdir(path)
    return new Promise((resolve, reject) => {
      try {
        deleteFolderRecursive(path)
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }
  delete(path) {
    return new Promise((resolve, reject) => {
      nodeFs.unlink(path, err => {
        if (err) {
          return reject(err)
        }
        resolve(true)
      })
    })
  }
  rename(oldPath, newPath) {
    return new Promise((resolve, reject) => {
      nodeFs.rename(oldPath, newPath, err => {
        if (err) {
          return reject(err)
        }
        resolve(true)
      })
    })
  }
  // stats cannot be used with the current FTP library... so this feature will be left out for now
  // stat(path) {
  //   return new Promise((resolve, reject) => {
  //     fs.stat(path, (err, stats) => {
  //       if (err) {
  //         return reject(err)
  //       }
  //       resolve(new LocalFileInfo(stats))
  //     })
  //   })
  // }
}

class LocalFileInfo extends FileInfo {
  isDirectory() {
    return this.original.isDirectory()
  }
}

class FtpFileSystem extends FileSystem {
  constructor(client) {
    super()
    this.client = client
  }
  static async create(host, port, user, password) {
    const c = new FtpClient()
    return new Promise((resolve, reject) => {
      c.on('ready', () => {
        resolve(new FtpFileSystem(c))
      })
      c.once('error', (err) => {
        reject(err)
      })
      c.connect({
        host,
        port,
        user,
        password
      })
    })
  }
  list(path) {
    return new Promise((resolve, reject) => {
      this.client.list(path, (err, listing) => {
        if (err) {
          return reject(err)
        }
        resolve(listing.map(l => new FtpFileInfo(l)))
      })
    })
  }
  put(src, toPath) {
    return new Promise((resolve, reject) => {
      this.client.put(src, toPath, (err) => {
        if (err) {
          reject(err)
        }
        resolve(true)
      })
    })
  }
  get(path) {
    return new Promise((resolve, reject) => {
      this.client.get(path, (err, stream) => {
        if (err) {
          return reject(err)
        }
        resolve(stream)
      })
    })
  }
  mkdir(path, recursive) {
    return new Promise((resolve, reject) => {
      this.client.mkdir(path, recursive, err => {
        if (err) {
          return reject(err)
        }
        resolve(true)
      })
    })
  }
  rmdir(path, recursive) {
    return new Promise((resolve, reject) => {
      this.client.rmdir(path, recursive, err => {
        if (err) {
          return reject(err)
        }
        resolve(1)
      })
    })
  }
  delete(path) {
    return new Promise((resolve, reject) => {
      this.client.delete(path, err => {
        if (err) {
          return reject(err)
        }
        resolve(path)
      })
    })
  }
  rename(oldPath, newPath) {
    return new Promise((resolve, reject) => {
      this.client.rename(oldPath, newPath, (err) => {
        if (err) {
          return reject(err)
        }
        resolve(true)
      })
    })
  }
}

class FtpFileInfo extends FileInfo {
  constructor(original) {
    super(original)
  }
  isDirectory() {
    return this.original.type === 'd'
  }
}

class SftpFileSystem extends FileSystem {
  constructor(client) {
    super()
    this.client = client
  }
  static async create(host, port, user, password) {
    const c = new SftpClient()
    return new Promise((resolve, reject) => {
      c.connect({
        host,
        port,
        username: user,
        password
      }).then(() => {
        resolve(new SftpFileSystem(c))
      }).catch(err => {
        reject(err)
      })
    })
  }
  async list(path) {
    return new Promise((resolve, reject) => {
      this.client.list(path)
        .then(paths => {
          resolve(paths.map(it => new SftpFileInfo(it)))
        }).catch(err => {
          reject(err)
        })
    })
  }
  put(src, toPath) {
    return this.client.put(src, toPath)
  }
  get(path) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.client.sftp.createReadStream(path))
      } catch (e) {
        reject(e)
      }
    })
  }
  mkdir(path, recursive) {
    return this.client.mkdir(path, recursive)
  }
  rmdir(path, recursive) {
    return this.client.rmdir(path, recursive)
  }
  delete(path) {
    return this.client.delete(path)
  }
  rename(oldPath, newPath) {
    return this.client.rename(oldPath, newPath)
  }
}

class SftpFileInfo extends FileInfo {
  constructor(original) {
    super(original)
  }
  isDirectory() {
    return this.original.type === 'd'
  }
}


module.exports = {
  FileSystem,
  FileInfo,
  LocalFileSystem,
  FtpFileSystem,
  SftpFileSystem,
  SftpFileInfo
}
