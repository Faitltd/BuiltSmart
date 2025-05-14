# BuildSmart by FAIT

BuildSmart is an interactive estimate builder system that helps users plan remodeling projects with accurate cost estimates. The application features a conversational chatbot interface that guides users through the process of creating detailed estimates for their remodeling projects.

## Features

- **Interactive Chat Interface**: Engage with the AI assistant to describe your remodeling project
- **Accurate Cost Estimates**: Get detailed cost breakdowns for materials and labor
- **Product Recommendations**: Receive suggestions for products that match your style and budget
- **Save and Share Estimates**: Store your estimates and share them with contractors
- **User Authentication**: Create an account to save and manage multiple projects

## Implementation Details

### Frontend

The frontend is built with modern web technologies:

- **HTML5**: Semantic markup for structure
- **CSS3**: Styling with custom properties and responsive design
- **JavaScript**: Interactive functionality and chatbot logic
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Font Awesome**: Icon library for visual elements

### Chatbot Conversation Flow

The chatbot follows a structured conversation flow to gather necessary information:

1. **Greeting & Initial Inquiry**: Welcome the user and understand which room(s) they want to remodel
2. **Room-Specific Details**: Gather dimensions for each room
3. **Budget & Design Preferences**: Understand budget range and desired aesthetic
4. **Product & Material Suggestions**: Provide relevant product recommendations
5. **Summary & Next Steps**: Provide a summary of selections and outline potential next steps

### UI/UX Considerations

- **Clarity and Simplicity**: Clear, concise language and unambiguous questions
- **Visual Feedback**: Typing indicators and message timestamps
- **Error Tolerance**: Graceful handling of typos or misunderstood inputs
- **Progress Indication**: Clear indication of where the user is in the process
- **Mobile-First Design**: Responsive layout that works well on all devices

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Start chatting with the BuildSmart assistant

## Project Structure

```
buildsmart-new/
├── index.html              # Main HTML file
├── src/
│   ├── styles/
│   │   └── main.css        # Custom CSS styles
│   └── scripts/
│       └── app.js          # JavaScript functionality
└── README.md               # Project documentation
```

## Labor Cost Data

The application uses the following labor cost data for calculations:

- **Framing**: $3.25-$3.75/sq ft
- **Drywall**: $1.90-$2.25/sq ft
- **Paint**: $0.95-$1.10/sq ft
- **Flooring**: $1.75-$2.50/sq ft
- **Insulation**: $1.00-$1.50/sq ft
- **Trim**: $1.50-$2.25/sq ft
- **Tile**: $10.00-$15.00/sq ft
- **Ceiling**: $1.50-$2.25/sq ft
- **Paint Touch-up**: $1.00-$1.20/sq ft

Hourly rates:
- **General Labor**: $60-$75/hr
- **Specialized Labor**: $85-$120/hr

## Usage Examples

### Starting a New Estimate

1. Open the application
2. Tell the chatbot which room(s) you want to remodel
3. Provide dimensions when prompted
4. Specify your budget range
5. Describe your design preferences
6. Review product recommendations
7. Get a detailed cost estimate

### Saving an Estimate

1. Complete the estimate process
2. Click "Save Project" or respond with "Yes" when asked if you want to save
3. Sign in or create an account if not already logged in
4. Access your saved estimates from your account

## Future Enhancements

- Integration with real product databases (Home Depot, Lowe's, etc.)
- Advanced visualization of remodeling projects
- Integration with contractor scheduling systems
- Mobile app version for on-the-go estimates

## License

© 2023 BuildSmart by FAIT. All rights reserved.
