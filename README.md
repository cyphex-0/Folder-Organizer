# Folder Organizer

A smart, automated folder organizer desktop application that monitors specified directories and automatically sorts incoming files into designated folders based on configurable rules.

## Tech Stack

This project is built using modern desktop application technologies:

*   **Electron**: Framework for building the cross-platform desktop application using web technologies.
*   **React (v19)**: Frontend library for building the user interface.
*   **Vite**: Fast frontend build tool and development server.
*   **Node.js**: Backend JavaScript runtime powering the core logic.
*   **Chokidar**: High-performance file system watcher.
*   **Lucide React**: Beautiful icon library for the frontend.

## Key Features

*   **Automated File Sorting**: Automatically move files to target directories based on their file extensions.
*   **Smart Folder Monitoring**: Continuously watch specified source folders for new files using `chokidar`.
*   **Custom Presets & Rules**: Define custom rule sets for sorting various file types (Images, Videos, Documents, etc.).
*   **Undo Capability**: Easily revert recent file moves from the detailed activity log.
*   **Conflict Resolution**: Automatically rename files when a naming conflict occurs in the destination folder.
*   **System Integration**: Run in the system tray, auto-start on login, and start minimized.
*   **Offline Functionality**: Runs entirely locally without the need for an internet connection.

## Download and Installation

**For most users**, there is no need to clone this repository or install programming tools. 

1. Navigate to the **[Releases](../../releases/latest)** section on the right side of this GitHub repository.
2. Download the latest executable file (`Folder.Organizer.Setup.exe`).
3. Run the downloaded installer. It will automatically install and launch the application.

## Developer Setup

If you want to modify the source code or build the application yourself, you will need **Node.js** (v18+) and **npm**.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd folderORG
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the application in development mode:**
    ```bash
    npm run dev
    ```

4.  **Build the application:**
    ```bash
    npm run build
    ```
    This packages the app and creates the installer in the `dist-electron` directory.

## Environment Variables

No environment variables are required to run this application. All configuration and state are managed locally within the application's persistent JSON store.

## Architecture Overview

The application follows a split frontend/backend architecture over Electron's IPC:

*   **Frontend (`/frontend`)**: A React application served by Vite. It communicates user actions and configuration changes to the backend via a secure IPC bridge (`preload.js`).
*   **Backend (`/backend`)**:
    *   **Core Store (`backend/core/store.js`)**: A persistent JSON-based key-value store managing user preferences, rules, source folders, and application state.
    *   **File Monitor (`backend/core/monitor.js`)**: Utilizes `chokidar` to monitor configured source directories. It handles a queue of incoming files, safely moves them to their destinations based on the rules, manages file locking, and provides undo functionality.
    *   **IPC Handlers (`backend/ipc/ipcHandlers.js`)**: Listens to frontend events and triggers the corresponding core logic (updating rules, toggling monitoring, opening folders, etc.).

## License

ISC License.
