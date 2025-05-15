import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface FileUploadResult {
  filename: string;
  mimetype: string;
  url: string;
}

// Process file upload
export const uploadFile = async (
  file: any,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']
): Promise<FileUploadResult> => {
  return new Promise((resolve, reject) => {
    // Validate file
    const { createReadStream, filename, mimetype } = file;
    
    // Check file type
    if (!allowedTypes.includes(mimetype)) {
      return reject(new Error(`File type ${mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
    
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${filename}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    
    // Create write stream
    const writeStream = fs.createWriteStream(filePath);
    const readStream = createReadStream();
    
    // Track file size
    let fileSize = 0;
    
    // Handle errors
    readStream.on('error', (error: Error) => {
      writeStream.end();
      return reject(error);
    });
    
    writeStream.on('error', (error: Error) => {
      readStream.destroy();
      return reject(error);
    });
    
    // Check file size
    readStream.on('data', (chunk: Buffer) => {
      fileSize += chunk.length;
      
      if (fileSize > MAX_FILE_SIZE) {
        readStream.destroy();
        writeStream.end();
        fs.unlinkSync(filePath);
        return reject(new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`));
      }
    });
    
    // Finish upload
    writeStream.on('finish', () => {
      // In a real implementation, this would return a URL to access the file
      const fileUrl = `/uploads/${uniqueFilename}`;
      
      resolve({
        filename: uniqueFilename,
        mimetype,
        url: fileUrl
      });
    });
    
    // Pipe read stream to write stream
    readStream.pipe(writeStream);
  });
};

// Delete file
export const deleteFile = async (filename: string): Promise<boolean> => {
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
