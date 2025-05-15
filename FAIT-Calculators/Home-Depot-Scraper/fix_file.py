# Script to fix the api_diagnostics_handler.py file
import ast

# Read the file as a string
with open('api_diagnostics_handler.py', 'r') as f:
    content = f.read()

# Evaluate the string to get the actual Python code
# This converts "\n" to actual newlines, etc.
try:
    # The content might be missing the closing quote, so add it if needed
    if not content.endswith('"'):
        content += '"'
    
    # Parse the string literal
    actual_code = ast.literal_eval(content)
    
    # Write the actual code back to the file
    with open('api_diagnostics_handler.py', 'w') as f:
        f.write(actual_code)
    
    print("File fixed successfully!")
except Exception as e:
    print(f"Error fixing file: {e}")