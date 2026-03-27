# Codeforces Problem Filter

A web-based tool designed to help competitive programmers efficiently discover and practice problems from Codeforces. The application enables users to filter problems by rating, tags, contest information, and difficulty level, reducing the time spent searching and allowing more focus on problem solving.

**Live Application:** https://cf-filter.vercel.app

---

## Overview

Practicing on Codeforces often involves manually browsing large problem sets, which can be inefficient and time-consuming. This project addresses that issue by providing a streamlined interface where users can quickly locate relevant problems based on their current skill level and learning goals.

The tool is particularly useful for:

* Structured practice by difficulty (rating-based filtering)
* Topic-focused preparation (e.g., dynamic programming, graphs)
* Contest-based exploration and upsolving

---

## Core Features

* **Rating-based Filtering**
  Select problems within a specific rating range to match your skill level.

* **Tag-based Filtering**
  Narrow down problems by topics such as dynamic programming, greedy algorithms, graphs, and more.

* **Contest-based Sorting**
  Organize problems based on contest origin to assist with upsolving and contest preparation.

* **Fast and Responsive Interface**
  Optimized for quick interaction and minimal loading time.

* **Clean User Experience**
  Minimal and focused UI to reduce distractions during problem selection.

* Filter Problems  by most recent Contest

* Filter Problems by A,B, C, D, E for each division.

---

## Technology Stack

* **Frontend Framework:** React (built with Vite)
* **Styling:** CSS
* **Deployment:** Vercel

The application is implemented as a single-page application (SPA) with client-side rendering.

---

## Project Motivation

The primary motivation behind this project is to simplify the process of selecting appropriate problems for practice. Many competitive programmers, especially beginners and intermediate users, struggle to find problems that align with their current level or specific topics they want to improve.

This tool provides:

* A structured way to approach problem solving
* Faster access to relevant practice material
* Improved learning efficiency

---

## Installation and Local Development

To run the project locally, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/mostafa-cse/Codeforces-Filter/tree/main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

---

## SEO and Discoverability

The project includes foundational search engine optimization practices to improve visibility:

* Structured meta tags (title, description, canonical URL)
* Open Graph and Twitter metadata for link sharing
* JSON-LD structured data for better search engine understanding
* Sitemap and robots.txt configuration
* Basic on-page content for keyword targeting

Further improvements such as server-side rendering and content expansion can enhance discoverability.

---

## Limitations

* The application currently relies on client-side rendering, which may limit initial crawlability for search engines.
* No user authentication or personalization features are implemented yet.
* Filtering capabilities are limited to predefined parameters.

---

## Future Enhancements

Planned improvements include:

* Server-side rendering using Next.js for better SEO performance
* User accounts and saved filter preferences
* Personalized problem recommendations
* Expanded filtering options
* Integration of educational content (e.g., guides, tutorials)
* Performance optimizations for large datasets

---

## Contribution Guidelines

Contributions are welcome and encouraged. To contribute:

1. Fork the repository
2. Create a new feature branch
3. Implement your changes
4. Submit a pull request with a clear description

Please ensure that your code follows standard best practices and is well-documented.

---

## Author

[Mostafa Kamal](https://www.linkedin.com/in/m0stafa-kamal/)

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute the software in accordance with the license terms.
