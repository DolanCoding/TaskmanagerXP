from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Unique ID for each category, automatically increments
    name = db.Column(db.String(100), unique=True, nullable=False)  # Category name, must be unique and not empty
    points = db.Column(db.Integer, default=0, nullable=False)  # Points for the category, default is 0
    tasks = db.relationship('Task', backref='category_obj', lazy=True)  # Relationship to Task, backref as 'category_obj'
    task_histories = db.relationship('TaskHistory', backref='category_obj', lazy=True)  # Relationship to TaskHistory

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Unique ID for each task, automatically increments
    name = db.Column(db.String(200), nullable=False)  # Task name, maximum 200 characters, cannot be empty
    description = db.Column(db.String(200), nullable=True)  # Optional description, maximum 200 characters
    due_date = db.Column(db.String(20), nullable=True)  # Due date as string (or use db.Date if you want)
    points = db.Column(db.Integer, nullable=True)  # Task points
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)  # Foreign key to Category
    created_at = db.Column(db.DateTime, server_default=db.func.now())  # Timestamp of when the task was created
    x = db.Column(db.Integer, nullable=True)  # X coordinate of the task card
    y = db.Column(db.Integer, nullable=True)  # Y coordinate of the task card

    def __repr__(self):
        return f'<Task {self.id}: {self.name}>'

class TaskHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Unique ID for each task history entry, automatically increments
    name = db.Column(db.String(200), nullable=False)  # Task name, maximum 200 characters, cannot be empty
    description = db.Column(db.String(200), nullable=True)  # Optional description, maximum 200 characters
    due_date = db.Column(db.String(20), nullable=True)  # Due date as string (or use db.Date if you want)
    points = db.Column(db.Integer, nullable=True)  # Task points
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)  # Foreign key to Category
    created_at = db.Column(db.DateTime, server_default=db.func.now())  # Timestamp of when the task history was created
    completed_at = db.Column(db.DateTime, nullable=True)  # Timestamp of when the task was completed

    def __repr__(self):
        return f'<TaskHistory {self.id}: {self.name}>'
