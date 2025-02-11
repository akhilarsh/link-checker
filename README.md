# Broken Link Checker

A Node.js application that scans websites for broken links using a breadth-first approach.

## Features

- Scans websites recursively up to a specified depth
- Checks for broken links within the same domain
- Provides detailed reports of broken links
- Configurable scan depth and timeout settings
- Pretty-printed console output with statistics

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/broken-link-checker.git
   cd broken-link-checker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .sample.env .env
   ```
   Then edit the `.env` file with your configuration.

## Environment Variables

| Variable   | Description                          | Default | Required |
| ---------- | ------------------------------------ | ------- | -------- |
| HOME_PAGE  | Starting URL for the scan            | -       | Yes      |
| MAX_DEPTH  | Maximum depth for recursive scanning | 2       | No       |
| TIMEOUT_MS | Request timeout in milliseconds      | 10000   | No       |

Example `.env` file:

```env
HOME_PAGE=https://www.example.com
MAX_DEPTH=2
TIMEOUT_MS=10000
```

## Usage

Run the link checker:

```bash
npm start
```

The application will:

1. Start from the specified HOME_PAGE
2. Scan all links on the page
3. Follow internal links up to MAX_DEPTH levels
4. Generate a report of any broken links found

## Output

The scanner provides:

- Real-time progress updates
- Summary of links found per page
- Table of broken links with details
- Final statistics including:
  - Total pages scanned
  - Total working links
  - Total broken links
  - Total unique URLs found

## Error Codes

The following error codes may be encountered:

| Code          | Description                    |
| ------------- | ------------------------------ |
| 400-599       | HTTP status codes              |
| TIMEOUT       | Request exceeded timeout limit |
| NETWORK_ERROR | Network connectivity issues    |
| UNKNOWN_ERROR | Unspecified errors             |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
