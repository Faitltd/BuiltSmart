from flask import Blueprint, render_template

# Create a blueprint
app_blueprint = Blueprint('app_file', __name__)

@app_blueprint.route('/app')
def app_index():
    # Define the search_types dictionary
    search_types = {
        'term': 'Search by Term',
        'category': 'Search by Category',
        'url': 'Search by URL'
        # Add any other search types your application uses
    }
    
    # Pass search_types to the template
    return render_template('index.html', search_types=search_types)
