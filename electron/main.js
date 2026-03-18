/*
  Electron main.js
  - Levanta el servidor Express (backend)
  - Abre la ventana con el frontend Vue compilado
*/

const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let backendProcess;

// ======================================
// LEVANTAR BACKEND
// ======================================

const iniciarBackend = () => {
  const serverPath = path.join(__dirname, "../backend/server.js");

  backendProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: "production" },
    silent: true,
  });

  backendProcess.stdout.on("data", (data) => {
    console.log("[Backend]", data.toString());
  });

  backendProcess.stderr.on("data", (data) => {
    console.error("[Backend Error]", data.toString());
  });

  backendProcess.on("exit", (code) => {
    console.log("[Backend] proceso terminado con código:", code);
  });
};

// ======================================
// CREAR VENTANA
// ======================================

const crearVentana = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../frontend/public/favicon.ico"),
    title: "Sistema RH",
    show: false, // no mostrar hasta que cargue
  });

  // Cargar el frontend compilado
  mainWindow.loadFile(path.join(__dirname, "../frontend/dist/index.html"));

  // Mostrar cuando esté listo
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  
  // Quitar menú nativo
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// ======================================
// INICIAR APP
// ======================================

app.whenReady().then(() => {
  iniciarBackend();

  // Esperar un momento a que Express arranque
  setTimeout(() => {
    crearVentana();
  }, 1500);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

// ======================================
// CERRAR APP
// ======================================

app.on("window-all-closed", () => {
  // Matar el backend al cerrar la app
  if (backendProcess) {
    backendProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
