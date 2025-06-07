# Detailed Issues and Bugs

This document provides a more detailed analysis of the issues and bugs found in the MarFanet application.

## Security Vulnerabilities

*   **SQL Injection:** While the application uses Drizzle ORM, which helps prevent SQL injection, there are still some areas where raw SQL is used. For example, the `getStats` function in `server/storage.ts` uses raw SQL, which could be a potential security risk if not handled carefully. It's better to use the ORM's query builder whenever possible to ensure that all queries are properly sanitized.
*   **Cross-Site Scripting (XSS):** The `/api/invoices/:id/view` endpoint is vulnerable to XSS. It retrieves invoice data from the database and then uses it to construct an HTML string. The `invoice.representative.fullName`, `invoice.representative.adminUsername`, and `invoice.representative.telegramId` fields are all rendered directly into the HTML without any escaping. This means that if an attacker can inject malicious HTML into these fields, they can execute arbitrary JavaScript in the user's browser. To fix this, all user-provided data should be properly escaped before being rendered into HTML.
*   **[FIXED] Insecure Direct Object References (IDOR):** The `/api/invoices/:id` endpoint was vulnerable to IDOR. It retrieved an invoice from the database by its ID and returned it to the client without checking if the user was authorized to access it. This has been fixed by adding a `userId` to the `invoices` table and checking if the `userId` in the session matches the `userId` associated with the invoice.
*   **[FIXED] Missing CSRF Protection:** The application was missing CSRF protection, which could allow an attacker to perform actions on behalf of a logged-in user without their consent. This has been fixed by adding the `csurf` middleware to the application.
*   **[FIXED] Broken Authentication Middleware:** The global authentication middleware in `server/auth-system.ts` was causing 403 errors and preventing some buttons from working. The middleware was too restrictive and was blocking access to some API routes and other necessary resources. This has been fixed by simplifying the middleware to be more permissive with API routes while still protecting the UI routes.
*   **[FIXED] Hardcoded API Paths:** The client-side code in `client/src/pages/invoices.tsx` was using hardcoded API paths. This has been fixed by creating a utility function that constructs the full API URL from a base URL and a given path.

## Performance Issues

*   **[FIXED] Inefficient Database Queries:** The `getStats` function in `server/storage.ts` was a clear example of an inefficient database query. It performed five separate `SELECT COUNT(*)` and `SELECT SUM(...)` queries to the database to get various statistics. This has been fixed by combining these queries into a single query using subqueries.
*   **Large Bundle Size:** The client-side bundle size is likely to be large due to the large number of dependencies. This could lead to slow loading times for the application.
*   **N+1 Queries:** The application may be vulnerable to the N+1 query problem, where it performs a separate query for each item in a list. This can lead to a large number of database queries and slow down the application.

## Code Quality Issues

*   **Monolithic Backend:** The `server/routes.ts` file is very large and contains a huge number of routes. This makes the backend difficult to maintain and scale. The routes should be broken down into smaller, more manageable modules.
*   **Duplicated Code:** There is a lot of duplicated code in the application, especially in the `server/routes.ts` file. This makes the code difficult to maintain and increases the risk of bugs.
*   **Lack of Comments:** The code is not well-commented, which makes it difficult to understand and maintain.
*   **Inconsistent Coding Style:** The coding style is inconsistent throughout the application, which makes the code difficult to read and understand.

## Business Logic Issues

*   **Incorrect Invoice Calculations:** The invoice calculation logic is complex and may contain errors. For example, the logic for calculating the commission for collaborators is not clear and may not be correct.
*   **Race Conditions:** The application may be vulnerable to race conditions, where two or more threads or processes access the same resource at the same time, leading to unexpected results. For example, the `createInvoice` function does not appear to have any locking mechanism to prevent two users from creating an invoice with the same number at the same time.
