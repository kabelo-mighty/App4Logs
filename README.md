# Log Analyzer

A comprehensive, multi-language log file analyzer with advanced filtering and export capabilities.

## Features

✨ **Key Features:**
- **Multiple Format Support**: Analyze logs in JSON, CSV, XML, and plain text formats
- **Advanced Filtering**: Filter by log level, date range, keywords, and source/component
- **Multi-Language Support**: English, Spanish, French, German, Chinese (Simplified), and Japanese
- **Real-time Statistics**: View error rates, log counts by severity level
- **Drag & Drop Upload**: Easy file upload with drag-and-drop support
- **Export Options**: Export filtered logs as JSON or CSV
- **Responsive Design**: Beautiful UI that works on desktop and tablet devices

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd /Users/kabelohlungwani/Desktop/App4Logs/App4Logs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### Uploading Log Files

1. Click the upload area or drag and drop a log file
2. Supported formats:
   - **JSON**: Array of log objects or single log object
   - **CSV**: Headers must include timestamp, level, source, message
   - **XML**: `<log>` elements containing log data
   - **Plain Text**: Auto-detected common log formats

### Filtering Logs

**Available Filters:**
- **Log Level**: Filter by ERROR, WARNING, INFO, DEBUG, TRACE
- **Date Range**: Select from/to dates (if applicable)
- **Keyword Search**: Search across message, source, and metadata
- **Source/Component**: Filter by specific log source

Click "Apply Filters" or changes apply in real-time. Use "Reset Filters" to clear all filters.

### Viewing Statistics

The statistics panel shows:
- Total number of logs
- Count by severity level (Error, Warning, Info, Debug)
- Error rate percentage with visual progress bar

### Exporting Data

After filtering, export your results:
- **Export as JSON**: Complete log objects with metadata
- **Export as CSV**: Tabular format for spreadsheet analysis

### Language Support

Click the language selector in the top-right corner to switch between:
- English
- Español (Spanish)
- Français (French)
- Deutsch (German)
- 中文 (Chinese Simplified)
- 日本語 (Japanese)

## Log Format Examples

### JSON
```json
[
  {
    "timestamp": "2024-01-27T10:30:00Z",
    "level": "ERROR",
    "source": "Database",
    "message": "Connection timeout"
  }
]
```

### Plain Text
```
[ERROR] 2024-01-27T10:30:00 Database Connection timeout
ERROR 2024-01-27 10:30:00 Connection timeout
```

### CSV
```
timestamp,level,source,message
2024-01-27T10:30:00Z,ERROR,Database,Connection timeout
```

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx        # File upload with drag-drop
│   ├── FilterPanel.tsx       # Filtering interface
│   ├── Statistics.tsx        # Statistics dashboard
│   ├── LogViewer.tsx         # Log display component
│   ├── ExportButtons.tsx     # Export functionality
│   └── LanguageSwitcher.tsx  # Language selection
├── services/
│   ├── logParser.ts          # Multi-format log parsing
│   └── logFilter.ts          # Filtering and analysis logic
├── types/
│   └── index.ts              # TypeScript interfaces
├── App.tsx                   # Main application
├── main.tsx                  # Entry point
├── i18n.ts                   # Internationalization config
└── index.css                 # Global styles
```

## Build & Deploy

### Production Build
```bash
npm run build
# or
yarn build
```

Output will be in the `dist/` directory.

### Preview Build
```bash
npm run preview
```

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS
- **i18next**: Internationalization

## Supported Log Formats

### Auto-Detection Patterns

The parser automatically detects:
- `[LEVEL] TIMESTAMP MESSAGE`
- `TIMESTAMP [LEVEL] MESSAGE`
- `TIMESTAMP LEVEL MESSAGE`
- JSON log objects with flexible field names
- CSV with headers
- XML with `<log>` elements

### Field Mapping

Parser looks for common field names (case-insensitive):
- **Timestamp**: timestamp, time, date, datetime, @timestamp
- **Level**: level, severity, priority, type
- **Source**: source, component, logger, service
- **Message**: message, msg, text, content, event

## Tips & Tricks

1. **Large Files**: The app handles files up to browser memory limits. For very large files, consider splitting them.

2. **Common Log Levels**: 
   - ERROR: Critical issues
   - WARNING: Important but recoverable issues
   - INFO: General information
   - DEBUG: Development debugging
   - TRACE: Detailed tracing

3. **Date Filtering**: Both start and end dates are inclusive.

4. **Keyword Search**: Searches across message text, source, and metadata fields.

## Troubleshooting

### "No valid logs found in file"
- Ensure your file format matches supported formats
- Check that log entries follow standard patterns
- For custom formats, ensure timestamp/level/message fields are present

### Filters not applying
- Ensure log levels are properly formatted (ERROR, WARNING, etc.)
- Check date format matches your log format
- Refresh the page if UI seems unresponsive

## License

MIT License - Feel free to use and modify

## Contributing

Contributions welcome! Please fork and submit pull requests for any improvements.
