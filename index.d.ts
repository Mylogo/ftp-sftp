export declare class FileInfo {

  getName(): string
  getSize(): number
  isDirectory(): boolean

}

export declare class FileSystem {

  list(path: string): Promise<FileInfo[]>;
  /**
   * 
   * @param src the data to put
   * returns the value of the FileSystem's put function.
   * Promise returns anything (maybe even null) if successful
   */
  put(src: NodeJS.ReadableStream, toPath: string): Promise<any>;

  get(path: string): Promise<NodeJS.ReadableStream>;

  /**
   * 
   * @param path path to create the directory
   * @param recursive Whether subdirectories need to be created
   * Creates a directory at the specified path
   * Promise returns anything (maybe even null) if successful
   */
  mkdir(path: string, recursive: boolean): Promise<any>;

  /**
   * 
   * @param path path to delete the directory
   * @param recursive Whether subdirectories need to be deleted
   * Deletes the directory at the specified path.
   * Promise returns anything (maybe even null) if successful
   */
  rmdir(path: string, recursive: boolean): Promise<any>;

  /**
   * 
   * @param path file to delete
   * Promise returns anything (maybe even null) if successful
   */
  delete(path: string): Promise<any>;

  /**
   * 
   * @param oldPath the path of the file/directory to rename
   * @param newPath the new path where the file/directory should be renamed/moved to
   * This operation can be used to simply rename or to move a file/directory
   * Example 1: rename('/User/someFile.txt', '/User/someNewName.txt') would rename the file
   * Example 2: rename('/User/someFile.txt', '/User/someDirectory/someFile.txt) move the file
   * Example 3: rename('/User/someFile.txt', '/User/someDirectory/someNewName.txt) move and rename the file
   */
  rename(oldPath: string, newPath: string): Promise<any>;

}

/**
 * This is a wrapper for the Node.js fs library
 * (a wrapper for require('fs'))
 * Instantiating will never fail, use the default constructor: new LocalFileSystem()
 */
export declare class LocalFileSystem extends FileSystem {

  constructor();

  /**
   * This function will never throw an exception
   * It's just for consistency (see: FtpFileSystem.create(), SftpFileSystem.create())
   * You can just use the constructor instead (new LocalFileSystem())
   */
  static create(): Promise<LocalFileSystem>;

}

/**
 * This is a wrapper for the FTP library
 * (a wrapper for require('ftp'))
 * You must instantiate it using the function FtpFileSystem.create()
 */
export declare class FtpFileSystem extends FileSystem {

  /**
   * 
   * @param host the FTP host
   * @param port the FTP port
   * @param user the FTP username
   * @param password the password for the FTP user
   * Promise returns an instance of FtpFileSystem if successful
   * Otherwise, throws the error from the FTP library
   */
  static create(host: string, port: number, user: string, password: string): Promise<FtpFileSystem>;

}

/**
 * This is a wrapper for the SFTP library
 * (a wrapper for require('ssh2-sftp-client'))
 * You must instantiate it using the function SftpFileSystem.create()
 */
export declare class SftpFileSystem extends FileSystem {

  /**
   * 
   * @param host the SFTP host
   * @param port the SFTP port
   * @param user the SFTP username
   * @param password the password for the SFTP user
   * Promise returns an instance of SftpFileSystem if successful
   * Otherwise, throws the error from the SFTP library
   */
  static create(host: string, port: number, user: string, password: string): Promise<SftpFileSystem>;

}