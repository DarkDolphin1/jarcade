use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(serde::Serialize)]
pub struct Game {
    name: String,
    path: String,
}

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<Game>, String> {
    let mut games = Vec::new();
    let dir = fs::read_dir(&path).map_err(|e| e.to_string())?;

    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path_buf = entry.path();
        if path_buf.is_file() && path_buf.extension().and_then(|s| s.to_str()) == Some("jar") {
            let name = path_buf
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            games.push(Game {
                name,
                path: path_buf.to_string_lossy().to_string(),
            });
        }
    }
    Ok(games)
}

#[tauri::command]
fn launch_game(game_path: String) -> Result<(), String> {
    // Assuming freej2me.jar is in the same directory as the executable or root during dev
    // For dev, it's in the project root. 
    // We might need to handle the path properly depending on where the app is run from.
    
    let mut command = Command::new("java");
    command.arg("-jar").arg("freej2me.jar").arg(game_path);

    // Spawn the process asynchronously/detached
    command.spawn().map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_directory, launch_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
