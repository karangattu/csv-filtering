# Client-Side CSV Filtering App

A React-based application that creates recursive filters for CSV files entirely in the browser.

## Features
- **Privacy First**: Data is processed locally (Client-Side). No file uploads to servers.
- **Auto-Detection**: Infers data types (String, Number, Date) to show relevant operators.
- **Recursive Filtering**: Create nested AND/OR groups.


## Setup
### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run the local dev server:
```bash
npm run dev
```

### 3. Build for Production
Create a static build (output in `dist/`):
```bash
npm run build
```