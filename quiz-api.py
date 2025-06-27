#!/usr/bin/env python3
import json
import os
import cgi
import cgitb

# Enable CGI error reporting
cgitb.enable()

# Set content type
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
print("Access-Control-Allow-Headers: Content-Type")
print()

# Handle preflight
if os.environ.get('REQUEST_METHOD') == 'OPTIONS':
    print(json.dumps({"status": "ok"}))
    exit()

# Get the data directory
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Parse the request
method = os.environ.get('REQUEST_METHOD', 'GET')
path_info = os.environ.get('PATH_INFO', '')

# Save quiz (POST)
if method == 'POST' and '/save/' in path_info:
    try:
        # Get course ID from path
        course_id = path_info.split('/save/')[-1]
        if not course_id:
            raise ValueError("No course ID provided")
        
        # Read POST data
        content_length = int(os.environ.get('CONTENT_LENGTH', 0))
        post_data = json.loads(os.sys.stdin.read(content_length))
        
        # Save to file
        filename = f"quiz_{course_id.replace(':', '_')}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        with open(filepath, 'w') as f:
            json.dump(post_data, f, indent=2)
        
        print(json.dumps({"success": True, "message": "Quiz saved"}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

# Load quiz (GET)
elif method == 'GET' and '/load/' in path_info:
    try:
        # Get course ID from path
        course_id = path_info.split('/load/')[-1]
        if not course_id:
            raise ValueError("No course ID provided")
        
        # Read from file
        filename = f"quiz_{course_id.replace(':', '_')}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                quiz_data = json.load(f)
            print(json.dumps(quiz_data))
        else:
            print(json.dumps({"error": "Quiz not found"}))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))

else:
    print(json.dumps({"error": "Invalid request"}))