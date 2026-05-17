# GitHub Release Guide

This document contains a template for your GitHub Release Notes and a step-by-step guide on how to publish the release with your compiled `.exe` binary.

---

## Draft Release Notes (v1.0.0)

**Release Title:** Folder Organizer v1.0.0 - Initial Release

**Description:**

Welcome to the first official release of **Folder Organizer**! 

Folder Organizer is a smart, automated desktop application designed to keep your file system clean by automatically sorting incoming files into designated folders based on customizable rules. 

### 🎉 What's New
* **Automated File Sorting:** Instantly move files to their correct destination based on their file extension.
* **Smart Folder Monitoring:** Continuous, low-resource background monitoring of your selected source folders.
* **Custom Rules & Presets:** Pre-configured rule sets for Images, Videos, Documents, and the ability to create entirely custom rule profiles.
* **Undo System:** Accidentally moved a file? Revert recent actions directly from the activity log.
* **System Tray Integration:** Start minimized or auto-start on login so it runs quietly in the background.

### 🚀 Getting Started (Instructions for End-Users)

1. **Download** the setup executable from the Assets section below.
2. **Double-click** the downloaded `.exe` file to run the installer. 
3. *Note on Windows SmartScreen:* Since this is an unsigned open-source executable, Windows might show a "Windows protected your PC" prompt. Click **"More info"** and then **"Run anyway"**.
4. Once installed, the application will launch automatically. You can configure your source folders and sorting rules directly from the intuitive dashboard.
5. The application will safely run in the background (accessible via your System Tray in the bottom right corner of your taskbar).

---

## Step-by-Step Release Guide (For the Developer)

Follow these steps to compile the application and publish your release on GitHub:

### 1. Build the Executable
Before tagging a release, you need to compile the React and Electron code into an executable file.
Open your terminal in the project root and run:
```bash
npm run build
```
*This command uses `electron-builder` as defined in your `package.json`. Once finished, you will find the generated `.exe` installer inside the `dist-electron` folder.*

### 2. Tag the Release in Git
Commit all your latest changes, then create and push a version tag:
```bash
git add .
git commit -m "chore: prepare for v1.0.0 release"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

### 3. Draft the Release on GitHub
1. Go to your repository page on GitHub.
2. On the right-hand sidebar, click on **Releases**, then click the **Draft a new release** button.
3. **Choose a tag:** Click the dropdown and select the `v1.0.0` tag you just pushed.
4. **Release title:** Enter `Folder Organizer v1.0.0 - Initial Release`.
5. **Describe this release:** Copy and paste the "Draft Release Notes" template provided above.
6. **Attach binaries:** Open your local `dist-electron` folder. Drag and drop the `.exe` installer file into the "Attach binaries by dropping them here" box at the bottom of the release page.
7. Click the green **Publish release** button.

Congratulations! Your users can now navigate to the Releases page and download the executable directly.
