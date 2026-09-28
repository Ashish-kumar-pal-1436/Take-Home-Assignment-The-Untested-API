# Bug Report

## Bug 1: Pagination skips the first page

### Location

`src/services/taskService.js`

Function:

`getPaginated(page, limit)`

### Expected behavior

The API documents pagination using 1-based page numbers.

For example, when there are five tasks and the client requests:

`page=1&limit=2`

the response should contain the first two tasks.

The expected pages are:

- Page 1 -> Task 1, Task 2
- Page 2 -> Task 3, Task 4
- Page 3 -> Task 5

### Actual behavior

Page 1 skipped the first two tasks and returned Task 3 and Task 4.

Page 2 returned only Task 5.

### How I discovered it

I added unit tests for `taskService.getPaginated()` using five tasks and a page size of two.

The first-page test expected Task 1 and Task 2 but received Task 3 and Task 4.

The second-page test expected Task 3 and Task 4 but received only Task 5.

### Why it happens

The implementation calculated the array offset as:

`page * limit`

Because the public API uses page numbers starting at 1, the first page should have an offset of zero.

The calculation made page 1 start at index `limit` instead of index `0`.

### Fix

The offset was changed to:

`(page - 1) * limit`

This keeps page numbers 1-based while converting them to the zero-based array index required by `Array.prototype.slice()`.

### Regression test

The failing pagination tests in:

`tests/taskService.test.js`

were kept after the fix.

They now verify that page 1 returns Task 1 and Task 2, and page 2 returns Task 3 and Task 4.
