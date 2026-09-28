const taskService = require('../src/services/taskService');

describe('taskService.create', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('creates a task with default values', () => {
    const task = taskService.create({
      title: 'Write tests',
    });

    expect(task).toEqual(
      expect.objectContaining({
        title: 'Write tests',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        completedAt: null,
      })
    );

    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeDefined();
  });

  test('creates a task with the supplied values', () => {
    const task = taskService.create({
      title: 'Fix API',
      description: 'Find and fix existing bugs',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-10-01T10:00:00.000Z',
    });

    expect(task.title).toBe('Fix API');
    expect(task.description).toBe('Find and fix existing bugs');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2026-10-01T10:00:00.000Z');
  });
});

describe('taskService.getAll and findById', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('returns all created tasks', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });

    const tasks = taskService.getAll();

    expect(tasks).toHaveLength(2);
    expect(tasks.map((task) => task.title)).toEqual(['Task 1', 'Task 2']);
  });

  test('finds a task by its id', () => {
    const created = taskService.create({
      title: 'Find this task',
    });

    const found = taskService.findById(created.id);

    expect(found).toEqual(created);
  });

  test('returns undefined when the task does not exist', () => {
    expect(taskService.findById('does-not-exist')).toBeUndefined();
  });
});

describe('taskService.getByStatus', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('returns tasks matching the requested status', () => {
    taskService.create({
      title: 'Todo task',
      status: 'todo',
    });

    taskService.create({
      title: 'Completed task',
      status: 'done',
    });

    const tasks = taskService.getByStatus('todo');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Todo task');
  });

  test('returns an empty array when no task matches', () => {
    taskService.create({
      title: 'Todo task',
      status: 'todo',
    });

    expect(taskService.getByStatus('done')).toEqual([]);
  });
});

describe('taskService.getPaginated', () => {
  beforeEach(() => {
    taskService._reset();

    for (let i = 1; i <= 5; i++) {
      taskService.create({
        title: `Task ${i}`,
      });
    }
  });

  test('returns the first page of tasks', () => {
    const tasks = taskService.getPaginated(1, 2);

    expect(tasks).toHaveLength(2);
    expect(tasks.map((task) => task.title)).toEqual(['Task 1', 'Task 2']);
  });

  test('returns the second page of tasks', () => {
    const tasks = taskService.getPaginated(2, 2);

    expect(tasks).toHaveLength(2);
    expect(tasks.map((task) => task.title)).toEqual(['Task 3', 'Task 4']);
  });
});

describe('taskService.update', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('updates an existing task', () => {
    const created = taskService.create({
      title: 'Original title',
      priority: 'low',
    });

    const updated = taskService.update(created.id, {
      title: 'Updated title',
      priority: 'high',
    });

    expect(updated.title).toBe('Updated title');
    expect(updated.priority).toBe('high');
    expect(updated.id).toBe(created.id);
  });

  test('returns null when updating a missing task', () => {
    expect(
      taskService.update('missing-id', {
        title: 'Updated',
      })
    ).toBeNull();
  });
});

describe('taskService.remove', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('removes an existing task', () => {
    const created = taskService.create({
      title: 'Delete me',
    });

    expect(taskService.remove(created.id)).toBe(true);
    expect(taskService.findById(created.id)).toBeUndefined();
  });

  test('returns false when removing a missing task', () => {
    expect(taskService.remove('missing-id')).toBe(false);
  });
});

describe('taskService.completeTask', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('marks an existing task as done', () => {
    const created = taskService.create({
      title: 'Complete me',
      priority: 'high',
    });

    const completed = taskService.completeTask(created.id);

    expect(completed.status).toBe('done');
    expect(completed.completedAt).toBeDefined();
  });

  test('returns null when completing a missing task', () => {
    expect(taskService.completeTask('missing-id')).toBeNull();
  });
});

describe('taskService.getStats', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('returns counts for each status', () => {
    taskService.create({
      title: 'Todo',
      status: 'todo',
    });

    taskService.create({
      title: 'In progress',
      status: 'in_progress',
    });

    taskService.create({
      title: 'Done',
      status: 'done',
    });

    const stats = taskService.getStats();

    expect(stats.todo).toBe(1);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.overdue).toBe(0);
  });

  test('counts an unfinished task with a past due date as overdue', () => {
    taskService.create({
      title: 'Overdue task',
      status: 'todo',
      dueDate: '2020-01-01T00:00:00.000Z',
    });

    const stats = taskService.getStats();

    expect(stats.overdue).toBe(1);
  });

  test('does not count completed tasks as overdue', () => {
    taskService.create({
      title: 'Completed old task',
      status: 'done',
      dueDate: '2020-01-01T00:00:00.000Z',
    });

    const stats = taskService.getStats();

    expect(stats.overdue).toBe(0);
  });
});