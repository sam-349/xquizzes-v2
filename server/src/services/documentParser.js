const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text content from uploaded documents (PDF, DOCX, TXT)
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    switch (ext) {
      case '.pdf':
        return await extractFromPDF(filePath);
      case '.docx':
        return await extractFromDOCX(filePath);
      case '.doc':
        return await extractFromDOCX(filePath);
      case '.txt':
        return await extractFromTXT(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`Document parsing error for ${filePath}:`, error.message);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractFromTXT(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Truncate text to stay within token limits (~4 chars per token)
 * Keep it under ~30k tokens for Gemini context
 */
function truncateText(text, maxChars = 100000) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n\n[... content truncated due to length ...]';
}

module.exports = { extractText, truncateText };
