# Collaborative Whiteboard Application

A real-time collaborative whiteboard application that allows multiple users to draw, share ideas, and collaborate in real-time. This application was built as part of a development exercise using React, TypeScript, and Bootstrap 5.

## Features

- **Real-time Collaboration**: Multiple users can join a whiteboard session and draw together in real-time.
- **Drawing Tools**: Brush and eraser tools with adjustable color and size.
- **Canvas History**: Undo/redo functionality using keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z).
- **Session Management**: Create, join, and manage whiteboard sessions with shareable links.
- **Image Upload**: Add images to the whiteboard canvas.
- **Mock ML Classification**: Images are "classified" with a mock ML service that generates random predictions.
- **Export Options**: Export whiteboard as PNG or PDF.
- **User Profiles**: Customize username and avatar color.
- **Real-time Chat**: Communicate with other participants in a session via chat.
- **Responsive Design**: Works on desktop and mobile devices.
- **Error Handling**: Robust null checking and graceful fallbacks for undefined values.
- **Onboarding Guide**: Interactive user guide for new users.

## Technology Stack

- **Frontend Framework**: React + TypeScript
- **UI Styling**: Bootstrap 5.0 
- **Drawing Canvas**: Konva.js
- **Real-Time Sync**: WebSockets (frontend-only mock implementation)
- **Authentication**: Mock service (placeholder for Keycloak integration)
- **User Storage**: localStorage
- **Testing**: Vitest with React Testing Library
- **Deployment**: GitHub Pages / Any static hosting

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to: http://localhost:5173

## Testing

This project uses Vitest and React Testing Library for unit testing components and services.

To run tests:
```
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
```

## Deployment

The application is configured for deployment to GitHub Pages, but can be deployed to any static hosting service.

### Building for Production

To build the application for production:

```
npm run build  # Standard build
```

The built files will be in the `dist` directory, which can be deployed to any static hosting service.

### Deploying to GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. The GitHub Actions workflow will automatically deploy the application when changes are pushed to the main branch

You can also manually trigger a deployment by running:
```
npm run build:github  # Build specifically for GitHub Pages
```

## Project Structure

```
whiteboard-app/
├── src/
│   ├── components/       # UI components
│   ├── pages/            # Page components
│   ├── contexts/         # React context providers
│   ├── services/         # Service modules
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── test/             # Test setup and utilities
│   ├── App.tsx           # Main App component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── package.json          # Project dependencies
```

## User Guide

### Creating a Whiteboard Session

1. Log in with any username/password (this is a mock authentication system)
2. Click "Create New Whiteboard" on the home page
3. A new whiteboard session will be created with a unique ID
4. Share this ID with others to invite them to join

### Joining a Session

1. Click "Join Existing Session" on the home page
2. Enter the session ID
3. You'll be connected to the existing session

### Using the Whiteboard

- Select the brush tool to draw freely
- Use the eraser tool to remove parts of your drawing
- Change brush color and size using the sidebar controls
- Use Ctrl+Z to undo and Ctrl+Shift+Z to redo
- Click "Add Image" to upload an image to the whiteboard
- Click "Export" to download your whiteboard as PNG or PDF

### Collaborating with Others

- Share your session using the "Share Session Link" button
- Invite others via email with the "Invite by Email" button
- See who's currently in the session in the participants list
- Chat with other participants using the chat panel

## Error Handling & Resilience

The application includes robust error handling:

- Graceful handling of undefined/null values with optional chaining and fallbacks
- User-friendly error messages and notifications
- Recovery mechanisms for failed operations
- Defensive programming techniques throughout the codebase

## Future Enhancements

- Integration with Keycloak for authentication
- Backend server for persistent storage
- Enhanced drawing tools (shapes, text, etc.)
- Video export with playback of drawing timeline
- End-to-end testing with Cypress

## License

This project is licensed under the MIT License.

## Acknowledgements

This project was created as a development exercise and is not intended for production use. It demonstrates front-end development skills with React, TypeScript, and Bootstrap 5.

## Running the Application

### In PowerShell:
```powershell
# First, change to the whiteboard-app directory
cd whiteboard-app
# Then run the development server
npm run dev
```

### In Command Prompt:
```cmd
cd whiteboard-app && npm run dev
```

### Using the Start Scripts:
We've provided convenient scripts for starting the application:

- For PowerShell: `./start-dev.ps1`
- For Windows Command Prompt: `start-dev.bat`

Run these from the whiteboard-app directory.
