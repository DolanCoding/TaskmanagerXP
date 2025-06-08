import subprocess
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import os

WATCHED_FOLDERS = ['templates', 'static', '.']  # Watch templates, static, and Python files
RELOAD_FILE = os.path.join('static', 'reload.txt')

def touch_reload_file():
    with open(RELOAD_FILE, 'w') as f:
        f.write(str(time.time()))

class RestartHandler(FileSystemEventHandler):
    def __init__(self, process_starter):
        self.process_starter = process_starter

    def on_any_event(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(('.py', '.html', '.css', '.js')):
            print(f"Change detected: {event.src_path}. Restarting server and touching reload.txt...")
            touch_reload_file()
            self.process_starter.restart()

class ProcessStarter:
    def __init__(self, command):
        self.command = command
        self.process = None
        self.start()

    def start(self):
        if self.process:
            self.process.terminate()
            self.process.wait()
        self.process = subprocess.Popen(self.command, shell=True)

    def restart(self):
        self.start()

    def stop(self):
        if self.process:
            self.process.terminate()
            self.process.wait()

if __name__ == "__main__":
    # Ensure reload.txt exists at startup
    if not os.path.exists('static'):
        os.makedirs('static')
    touch_reload_file()
    starter = ProcessStarter(f'"{sys.executable}" app.py')
    event_handler = RestartHandler(starter)
    observer = Observer()
    for folder in WATCHED_FOLDERS:
        if os.path.exists(folder):
            observer.schedule(event_handler, folder, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        starter.stop()
    observer.join()
