/**
 * Server Check Utility
 * 
 * Simple utility to check if a server is running on a specific port.
 * Easy to configure for any project - just update SERVER_PORT and SERVER_HOST.
 */

// Configuration - Update these for your project
const SERVER_PORT = process.env.REACT_APP_SERVER_PORT || 4000;
const SERVER_HOST = process.env.REACT_APP_SERVER_HOST || 'localhost';
const CHECK_TIMEOUT = 3000; // 3 seconds

/**
 * Check if server is running by attempting a connection
 */
export const checkServerRunning = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

    const response = await fetch(`http://${SERVER_HOST}:${SERVER_PORT}`, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Avoid CORS issues, we just need to know if server responds
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    // Server is not running or not reachable
    return false;
  }
};

/**
 * Display error message when server is not running
 */
export const showServerError = () => {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      padding: 20px;
      text-align: center;
    ">
      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      ">
        <h1 style="margin: 0 0 20px 0; font-size: 2.5em;">⚠️ Server Not Running</h1>
        <p style="font-size: 1.2em; margin: 0 0 30px 0; opacity: 0.9;">
          The backend server is not running on <strong>${SERVER_HOST}:${SERVER_PORT}</strong>
        </p>
        <div style="
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        ">
          <p style="margin: 0 0 10px 0; font-weight: bold;">To start the server:</p>
          <code style="
            display: block;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          ">npm run start-server</code>
          <p style="margin: 10px 0 0 0; font-size: 0.9em; opacity: 0.8;">
            Or use <code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px;">npm start</code> to run both server and frontend
          </p>
        </div>
        <button onclick="location.reload()" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 30px;
          font-size: 1em;
          font-weight: bold;
          border-radius: 25px;
          cursor: pointer;
          margin-top: 20px;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Retry Connection
        </button>
      </div>
    </div>
  `;
};
