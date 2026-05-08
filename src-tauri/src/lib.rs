use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use log::{info, error, debug};

#[derive(serde::Serialize)]
pub struct Game {
    name: String,
    path: String,
}

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<Game>, String> {
    info!("CWD: {:?}, Attempting to scan directory: {}", std::env::current_dir().unwrap(), path);
    
    let path_buf = Path::new(&path);
    let absolute_path = fs::canonicalize(path_buf)
        .or_else(|_| Ok::<PathBuf, String>(path_buf.to_path_buf()))
        .unwrap();
    
    info!("Resolved absolute path: {:?}", absolute_path);

    if !absolute_path.exists() {
        let err_msg = format!("Directory does not exist: {:?}", absolute_path);
        error!("{}", err_msg);
        return Err(err_msg);
    }

    if !absolute_path.is_dir() {
        let err_msg = format!("Path is not a directory: {:?}", absolute_path);
        error!("{}", err_msg);
        return Err(err_msg);
    }

    let mut games = Vec::new();
    let dir = fs::read_dir(&absolute_path).map_err(|e| {
        let err_msg = format!("Failed to read directory {:?}: {} (OS Error: {:?})", absolute_path, e, e.raw_os_error());
        error!("{}", err_msg);
        err_msg
    })?;

    for entry in dir {
        let entry = entry.map_err(|e| {
            error!("Error reading directory entry: {}", e);
            e.to_string()
        })?;
        let path_buf = entry.path();
        
        if path_buf.is_file() && path_buf.extension().and_then(|s| s.to_str()) == Some("jar") {
            let name = path_buf
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            
            debug!("Found game: {} at {:?}", name, path_buf);
            
            games.push(Game {
                name,
                path: path_buf.to_string_lossy().to_string(),
            });
        }
    }
    
    info!("Successfully found {} games", games.len());
    Ok(games)
}

#[tauri::command]
fn launch_game(game_path: String) -> Result<(), String> {
    info!("Attempting to launch game: {}", game_path);
    
    let jar_path = "../freej2me.jar";
    if !Path::new(jar_path).exists() {
        let err_msg = format!("Emulator JAR not found: {}", jar_path);
        error!("{}", err_msg);
        return Err(err_msg);
    }

    let game_url = format!("file://{}", game_path);
    info!("Executing command: java -jar {} {}", jar_path, game_url);
    
    let mut command = Command::new("java");
    command.arg("-jar").arg(jar_path).arg(game_url);

    match command.spawn() {
        Ok(child) => {
            info!("Process spawned successfully with PID: {:?}", child.id());
            Ok(())
        }
        Err(e) => {
            let err_msg = format!("Failed to spawn java process: {} (OS Error: {:?})", e, e.raw_os_error());
            error!("{}", err_msg);
            Err(err_msg)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    info!("Initializing JArcade Backend...");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_directory, launch_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
