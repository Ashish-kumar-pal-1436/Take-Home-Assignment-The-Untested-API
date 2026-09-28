const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('GET /tasks', () => {

    test('returns all created tasks', async () => {
  await request(app)
    .post('/tasks')
    .send({
      title: 'Task 1',
    });

  await request(app)
    .post('/tasks')
    .send({
      title: 'Task 2',
    });

  const response = await request(app)
    .get('/tasks');

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(2);
  expect(response.body.map((task) => task.title)).toEqual([
    'Task 1',
    'Task 2',
  ]);
});
  test('returns an empty array when there are no tasks', async () => {
    const response = await request(app)
      .get('/tasks');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

    test('filters tasks by status', async () => {
  await request(app)
    .post('/tasks')
    .send({
      title: 'Todo task',
      status: 'todo',
    });

  await request(app)
    .post('/tasks')
    .send({
      title: 'Completed task',
      status: 'done',
    });

  const response = await request(app)
    .get('/tasks?status=done');

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0].title).toBe('Completed task');
  expect(response.body[0].status).toBe('done');
});

test('returns paginated tasks', async () => {
  for (let i = 1; i <= 5; i++) {
    await request(app)
      .post('/tasks')
      .send({
        title: `Task ${i}`,
      });
  }

  const response = await request(app)
    .get('/tasks?page=2&limit=2');

  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveLength(2);
  expect(response.body.map((task) => task.title)).toEqual([
    'Task 3',
    'Task 4',
  ]);
});
});


describe('GET /tasks/stats', () => {
  test('returns task statistics', async () => {
    await request(app)
      .post('/tasks')
      .send({
        title: 'Todo task',
        status: 'todo',
      });

    await request(app)
      .post('/tasks')
      .send({
        title: 'In progress task',
        status: 'in_progress',
      });

    await request(app)
      .post('/tasks')
      .send({
        title: 'Done task',
        status: 'done',
      });

    const response = await request(app)
      .get('/tasks/stats');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      todo: 1,
      in_progress: 1,
      done: 1,
      overdue: 0,
    });
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes an existing task', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task to delete',
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .delete(`/tasks/${taskId}`);

    expect(response.statusCode).toBe(204);
    expect(response.body).toEqual({});
  });

  test('returns 404 when the task does not exist', async () => {
    const response = await request(app)
      .delete('/tasks/missing-id');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: 'Task not found',
    });
  });
});

describe('PATCH /tasks/:id/complete', () => {
  test('marks an existing task as completed', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task to complete',
        priority: 'high',
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/complete`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.status).toBe('done');
    expect(response.body.completedAt).toBeDefined();
  });

  test('returns 404 when the task does not exist', async () => {
    const response = await request(app)
      .patch('/tasks/missing-id/complete');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: 'Task not found',
    });
  });
});

describe('PUT /tasks/:id', () => {
  test('updates an existing task', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Original title',
        priority: 'low',
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .put(`/tasks/${taskId}`)
      .send({
        title: 'Updated title',
        priority: 'high',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.title).toBe('Updated title');
    expect(response.body.priority).toBe('high');
  });

  test('returns 404 when the task does not exist', async () => {
    const response = await request(app)
      .put('/tasks/missing-id')
      .send({
        title: 'Updated title',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: 'Task not found',
    });
  });

  test('returns 400 when an invalid status is provided', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task to update',
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .put(`/tasks/${taskId}`)
      .send({
        status: 'invalid-status',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      'status must be one of: todo, in_progress, done'
    );
  });
});

describe('POST /tasks', () => {
  test('creates a task successfully', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({
        title: 'Build API tests',
        description: 'Write integration tests with Supertest',
        priority: 'high',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        title: 'Build API tests',
        description: 'Write integration tests with Supertest',
        priority: 'high',
        status: 'todo',
      })
    );

    expect(response.body.id).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
  });

  test('returns 400 when title is missing', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({
        description: 'Task without title',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      'title is required and must be a non-empty string'
    );
  });
});

describe('PATCH /tasks/:id/assign', () => {
  test('assigns a task to an assignee', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task to assign',
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: 'John',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.assignee).toBe('John');
  });

  test('returns 404 when assigning a missing task', async () => {
    const response = await request(app)
      .patch('/tasks/missing-id/assign')
      .send({
        assignee: 'John',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: 'Task not found',
    });
  });

  test('returns 400 when assignee is empty', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task with invalid assignee',
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: '   ',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: 'assignee must be a non-empty string',
    });
  });

  test('allows an existing task to be reassigned', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({
        title: 'Task to reassign',
      });

    const taskId = createResponse.body.id;

    await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: 'John',
      });

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: 'Sarah',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.assignee).toBe('Sarah');
  });
});