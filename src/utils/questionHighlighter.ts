// Utility function to highlight questions ending with question marks
export function highlightQuestions(text: string): string {
  if (!text) return text;
  
  // Regex to find phrases that start with a capital letter and end with a question mark
  // This aims to capture only the question part, not preceding sentences.
  const questionRegex = /(\b[A-Z][^.!?]*?\?+)/g;
  
  return text.replace(questionRegex, (match) => {
    const trimmedMatch = match.trim();
    if (trimmedMatch) {
      return `<span class="question-highlight">${trimmedMatch}</span>`;
    }
    return match;
  });
}

// Enhanced version that also handles HTML content and ensures new lines for questions
export function highlightQuestionsInHTML(html: string): string {
  if (!html) return html;
  
  // First convert <br> tags to newlines for processing
  let processedHtml = html.replace(/<br\s*\/?>/gi, '\n');
  
  // Split by HTML tags to preserve them
  const parts = processedHtml.split(/(<[^>]*>)/);
  
  const highlightedParts = parts.map(part => {
    if (part.startsWith('<') && part.endsWith('>')) {
      // It's an HTML tag, return as is
      return part;
    } else {
      // It's text content, apply question highlighting and line breaks
      // Regex to find phrases that start with a capital letter and end with a question mark
      const questionRegex = /(\b[A-Z][^.!?]*?\?+)/g; 

      return part.replace(questionRegex, (match, offset, string) => {
        const trimmedMatch = match.trim();
        if (trimmedMatch) {
          // Check if the match is preceded by a newline character or is at the very beginning of the 'part'
          const isPrecededByNewline = offset > 0 && string[offset - 1] === '\n';
          const isAtStartOfPart = offset === 0;

          let prefix = '';
          // If not at start and not preceded by newline, add a newline
          if (!isPrecededByNewline && !isAtStartOfPart) {
            prefix = '\n';
          }
          return `${prefix}<span class="question-highlight">${trimmedMatch}</span>`;
        }
        return match;
      });
    }
  });

  // Reconstruct HTML, converting newlines back to <br>
  return highlightedParts.join('').replace(/\n/g, '<br>');
}
