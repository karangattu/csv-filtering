# 📊 Advanced CSV Filtering App

A powerful, privacy-first React application for filtering, analyzing, and transforming CSV data entirely in your browser. No data ever leaves your machine.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Features
- **🔒 Privacy First** - All data processing happens locally in your browser
- **📁 Multi-Table Support** - Load multiple CSV files and work with them together
- **🔗 Table Joins** - Join tables on matching columns (like SQL)
- **🎨 Dark/Light Mode** - Beautiful UI with theme toggle

### 🔍 Advanced Filtering
- **Recursive Filters** - Create nested AND/OR filter groups
- **Smart Operators** - Auto-detects column types (String, Number, Date) for relevant operators
- **Case Sensitivity** - Toggle case-sensitive matching
- **Quick Search** - Instant search across all columns

### 📈 Data Visualization
- **Charts View** - Bar charts and pie charts for categorical data
- **Column Statistics** - Min, max, avg, median, mode, std deviation with sparkline charts
- **Pivot Tables** - Group and aggregate data with Sum, Average, Count, Min, Max functions

### 🏆 Data Quality & Analysis
- **Data Quality Score** - Detect missing values, duplicates, and outliers (0-100% score)
- **Smart Column Detection** - Auto-detects emails, phone numbers, URLs, currency, dates
- **Type Badges** - Visual indicators for detected column types

### ✨ Data Cleaning
- **Trim Whitespace** - Remove leading/trailing spaces
- **Case Conversion** - UPPERCASE, lowercase, Title Case
- **Remove Special Characters** - Clean up messy data
- **Remove Duplicates** - One-click duplicate row removal
- **Live Preview** - See changes before applying

### 📤 Export
- **Download CSV** - Export filtered data
- **Export Pivot** - Download pivot table results

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm run test:e2e
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization
- **PapaParse** - CSV parsing
- **Lucide React** - Icons
- **Playwright** - E2E testing

## 📖 Usage Guide

### Filtering Data
1. Upload a CSV file
2. Use the Filter Builder to add conditions
3. Combine filters with AND/OR logic
4. Download filtered results

### Using Pivot Tables
1. Switch to the **Pivot** tab
2. Select a **Row Field** to group by
3. Optionally add a **Column Field** for cross-tabulation
4. Choose a **Value Field** and aggregation function
5. Click **Help** for a beginner tutorial

### Data Cleaning
1. Click **Clean Data** button
2. Select a column
3. Choose a cleaning operation
4. Preview changes and apply

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.