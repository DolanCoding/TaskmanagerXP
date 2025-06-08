# taskmanagerXP/app.py
from flask import Flask, render_template, request, redirect, url_for, jsonify
from datetime import datetime, UTC
from models import Task, TaskHistory, Category, db
from flask_migrate import Migrate

# 1. Initialize Flask Application
app = Flask(__name__)

# Disable Jinja2 template caching in development
app.jinja_env.cache = {}  # Ensures template changes are always picked up

# 2. Configure Database
# This tells SQLAlchemy where our database file is. 'sqlite:///tasks.db' means a file named 'tasks.db'
# will be created in your project's root directory.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Suppress a warning for a cleaner console
db.init_app(app) # Initialize SQLAlchemy with our Flask app
migrate = Migrate(app, db) # Initialize Flask-Migrate

# 3. Define Routes (What happens when a URL is accessed)

# Homepage Route: Handles GET requests to the root URL (e.g., http://127.0.0.1:5000/)
@app.route('/')
def index():
    tasks = Task.query.order_by(Task.id.desc()).all()
    # Get all categories from the database
    all_categories = Category.query.order_by(Category.name).all()
    # Calculate points by category for sidebar
    points_by_category = {cat.name: cat.points for cat in all_categories}
    # Get task history for taskhistory.html
    task_history = TaskHistory.query.order_by(TaskHistory.completed_at.desc()).all()
    return render_template(
        'index.html',
        tasks=tasks,
        points_by_category=points_by_category,
        task_history=task_history,
        all_categories=all_categories
    )

# Task Creation Route: Handles POST requests to /tasks (when the form is submitted)
@app.route('/tasks', methods=['POST'])
def add_task():
    form = request.form
    category_name = form.get('category')
    category = Category.query.filter_by(name=category_name).first()
    new_task = Task(
        name=form.get('name'),
        description=form.get('description'),
        due_date=form.get('due_date'),
        points=form.get('points'),
        category_id=category.id if category else None
    )
    db.session.add(new_task)
    db.session.commit()
    return redirect(url_for('index'))

# Task Deletion Route: Handles POST requests to /delete_task/<task_id>
@app.route('/delete_task/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return redirect(url_for('index'))

# Task Completion Route: Handles POST requests to /complete_task/<task_id>
@app.route('/complete_task/<int:task_id>', methods=['POST'])
def complete_task(task_id):
    task = Task.query.get_or_404(task_id)
    # Find the category and add points
    category = db.session.get(Category, task.category_id)
    if category and task.points:
        category.points = (category.points or 0) + int(task.points)
    # Move task to TaskHistory
    task_history = TaskHistory(
        name=task.name,
        description=task.description,
        due_date=task.due_date,
        points=task.points,
        category_id=task.category_id,
        created_at=task.created_at,
        completed_at=datetime.now(UTC)
    )
    db.session.add(task_history)
    db.session.delete(task)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/update_task_position', methods=['POST'])
def update_task_position():
    print("Received request to update task position")
    data = request.get_json()
    print(f"Data received: {data} (types: task_id={type(data.get('task_id'))}, x={type(data.get('x'))}, y={type(data.get('y'))})")
    task_id = data.get('task_id')
    x = data.get('x')
    y = data.get('y')
    if task_id is None or x is None or y is None:
        print("Missing task_id, x, or y!")
        return jsonify({'success': False, 'error': 'Missing task_id, x, or y'}), 400
    task = Task.query.get(task_id)
    if not task:
        print("Task not found!")
        return jsonify({'success': False, 'error': 'Task not found'}), 404
    try:
        task.x = int(x)
        task.y = int(y)
    except Exception as e:
        print(f"Error casting x/y to int: {e}")
        return jsonify({'success': False, 'error': 'Invalid x or y'}), 400
    db.session.commit()
    print(f"Saved position for task {task_id}: x={task.x}, y={task.y}")
    return jsonify({'success': True, 'task_id': task_id, 'x': task.x, 'y': task.y})

@app.route('/update_multiple_task_positions', methods=['POST'])
def update_multiple_task_positions():
    data = request.get_json()
    updates = data.get('updates', [])
    updated_ids = []
    for upd in updates:
        task_id = upd.get('task_id')
        x = upd.get('x')
        y = upd.get('y')
        if task_id is not None and x is not None and y is not None:
            task = Task.query.get(task_id)
            if task:
                try:
                    task.x = int(x)
                    task.y = int(y)
                    updated_ids.append(task_id)
                except Exception as e:
                    print(f"Error updating task {task_id}: {e}")
    db.session.commit()
    print(f"Updated positions for tasks: {updated_ids}")
    return jsonify({'success': True, 'updated_ids': updated_ids})

def always_reload():
    return True

# 5. Application Startup
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Add initial categories if they do not exist
        initial_categories = [
            'hobby', 'living', 'housekeeping', 'friends', 'work', 'health', 'other', 'learning'
        ]
        from models import Category
        for cat_name in initial_categories:
            if not Category.query.filter_by(name=cat_name).first():
                db.session.add(Category(name=cat_name))
        db.session.commit()
        print("Created new database and ensured initial categories exist.")
    # Only run the Flask dev server if executed directly (not when imported by Gunicorn)
    app.run(port=5000, host='0.0.0.0', debug=False)