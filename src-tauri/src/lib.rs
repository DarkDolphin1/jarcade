use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::io::{Read, Write};
use log::{info, error, debug};
use zip::ZipArchive;
use base64::{Engine as _, engine::general_purpose};
use std::sync::Mutex;
use std::collections::{HashMap, HashSet};
use tauri::{Manager, Emitter, State};

struct AppState {
    running_games: Mutex<HashSet<String>>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct GamePersistentData {
    pub favorite: bool,
    pub playtime: u64, // total seconds
}

#[derive(serde::Serialize, serde::Deserialize, Default)]
pub struct Library {
    pub games: std::collections::HashMap<String, GamePersistentData>,
}

#[derive(serde::Serialize)]
pub struct Game {
    name: String,
    path: String,
    icon: Option<String>,
    favorite: bool,
    playtime: u64,
}

fn get_library_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let mut path = app_handle.path().app_data_dir().expect("failed to get app data dir");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("library.json");
    path
}

#[tauri::command]
fn get_library_data(app_handle: tauri::AppHandle) -> Library {
    let path = get_library_path(&app_handle);
    if !path.exists() {
        return Library::default();
    }

    let mut file = fs::File::open(path).unwrap();
    let mut contents = String::new();
    let _ = file.read_to_string(&mut contents);
    serde_json::from_str(&contents).unwrap_or_default()
}

#[tauri::command]
fn save_library_data(app_handle: tauri::AppHandle, data: Library) -> Result<(), String> {
    let path = get_library_path(&app_handle);
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    let mut file = fs::File::create(path).map_err(|e| e.to_string())?;
    file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

fn get_game_metadata(jar_path: &Path) -> (String, Option<String>) {
    let file = match fs::File::open(jar_path) {
        Ok(f) => f,
        Err(_) => return (jar_path.file_stem().unwrap().to_string_lossy().into_owned(), None),
    };

    let mut archive = match ZipArchive::new(file) {
        Ok(a) => a,
        Err(_) => return (jar_path.file_stem().unwrap().to_string_lossy().into_owned(), None),
    };

    let mut manifest_content = String::new();
    let mut game_name = jar_path.file_stem().unwrap().to_string_lossy().into_owned();
    let mut icon_path: Option<String> = None;

    if let Ok(mut manifest_file) = archive.by_name("META-INF/MANIFEST.MF") {
        let _ = manifest_file.read_to_string(&mut manifest_content);
        
        let mut lines = Vec::new();
        let raw_lines = manifest_content.lines();
        for line in raw_lines {
            if line.starts_with(' ') {
                if let Some(last) = lines.last_mut() {
                    *last = format!("{}{}", last, line.trim());
                }
            } else {
                lines.push(line.to_string());
            }
        }

        for line in lines {
            if line.starts_with("MIDlet-Name:") {
                game_name = line.replace("MIDlet-Name:", "").trim().to_string();
            } else if line.starts_with("MIDlet-1:") {
                let replaced = line.replace("MIDlet-1:", "");
                let parts: Vec<&str> = replaced.split(',').collect();
                if parts.len() >= 2 {
                    if game_name == jar_path.file_stem().unwrap().to_string_lossy() {
                        game_name = parts[0].trim().to_string();
                    }
                    icon_path = Some(parts[1].trim().to_string());
                }
            }
        }
    }

    let mut icon_data: Option<String> = None;
    if let Some(path) = icon_path {
        let clean_path = if path.starts_with('/') { &path[1..] } else { &path };
        if let Ok(mut icon_file) = archive.by_name(clean_path) {
            let mut buffer = Vec::new();
            if icon_file.read_to_end(&mut buffer).is_ok() {
                icon_data = Some(format!("data:image/png;base64,{}", general_purpose::STANDARD.encode(buffer)));
            }
        }
    }

    (game_name, icon_data)
}

#[tauri::command]
fn scan_directory(app_handle: tauri::AppHandle, path: String) -> Result<Vec<Game>, String> {
    info!("CWD: {:?}, Attempting to scan directory: {}", std::env::current_dir().unwrap(), path);
    
    let absolute_path = fs::canonicalize(&target_path)
        .or_else(|_| Ok::<PathBuf, String>(target_path.clone()))
        .unwrap();
    
    if !absolute_path.exists() {
        let err_msg = format!("Directory does not exist: {:?}", absolute_path);
        error!("{}", err_msg);
        return Err(err_msg);
    }

    let library = get_library_data(app_handle);
    let mut games = Vec::new();
    let dir = fs::read_dir(&absolute_path).map_err(|e| {
        let err_msg = format!("Failed to read directory {:?}: {} (OS Error: {:?})", absolute_path, e, e.raw_os_error());
        error!("{}", err_msg);
        err_msg
    })?;

    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path_buf = entry.path();
        
        if path_buf.is_file() && path_buf.extension().and_then(|s| s.to_str()) == Some("jar") {
            let (name, icon) = get_game_metadata(&path_buf);
            let p_str = path_buf.to_string_lossy().to_string();
            
            let p_data = library.games.get(&p_str).cloned().unwrap_or(GamePersistentData {
                favorite: false,
                playtime: 0,
            });

            debug!("Found game: {} at {:?}", name, path_buf);
            
            games.push(Game {
                name,
                path: p_str,
                icon,
                favorite: p_data.favorite,
                playtime: p_data.playtime,
            });
        }
    }
    
    info!("Successfully found {} games", games.len());
    Ok(games)
}

#[tauri::command]
fn add_playtime(app_handle: tauri::AppHandle, game_path: String, seconds: u64) -> Result<(), String> {
    let mut library = get_library_data(app_handle.clone());
    let entry = library.games.entry(game_path).or_insert(GamePersistentData {
        favorite: false,
        playtime: 0,
    });
    entry.playtime += seconds;
    save_library_data(app_handle, library)?;
    Ok(())
}

#[tauri::command]
fn launch_game(app_handle: tauri::AppHandle, state: State<'_, AppState>, game_path: String) -> Result<(), String> {
    info!("Attempting to launch game: {}", game_path);
    
    // Check if already running
    {
        let running = state.running_games.lock().unwrap();
        if running.contains(&game_path) {
            return Err("This game is already running.".to_string());
        }
    }

    let jar_path = "../freej2me.jar";
    if !Path::new(jar_path).exists() {
        let err_msg = format!("Emulator JAR not found: {}", jar_path);
        error!("{}", err_msg);
        return Err(err_msg);
    }

    let game_url = format!("file://{}", game_path);
    info!("Executing command: java -jar {:?} {}", jar_path, game_url);
    
    let mut command = Command::new("java");
    command.arg("-jar").arg(&jar_path).arg(game_url);

    let mut child = command.spawn().map_err(|e| {
        let err_msg = format!("Failed to spawn java process: {} (OS Error: {:?})", e, e.raw_os_error());
        error!("{}", err_msg);
        err_msg
    })?;

    let game_path_clone = game_path.clone();
    let app_handle_clone = app_handle.clone();
    
    // Emit "game-started" event
    let _ = app_handle.emit("game-started", &game_path_clone);

    // Track in state
    {
        let mut running = state.running_games.lock().unwrap();
        running.insert(game_path_clone.clone());
    }

    // Spawn a thread to wait for the process to exit
    std::thread::spawn(move || {
        let start_time = std::time::Instant::now();
        match child.wait() {
            Ok(status) => {
                let duration = start_time.elapsed().as_secs();
                info!("Game process exited with status: {:?}. Played for {} seconds.", status, duration);
                
                // Remove from state
                {
                    let state = app_handle_clone.state::<AppState>();
                    let mut running = state.running_games.lock().unwrap();
                    running.remove(&game_path_clone);
                }

                // Update playtime in library
                let _ = add_playtime(app_handle_clone.clone(), game_path_clone.clone(), duration);
                
                // Emit "game-exited" event
                let _ = app_handle_clone.emit("game-exited", &game_path_clone);
            }
            Err(e) => {
                error!("Error waiting for game process: {}", e);
                // Ensure cleanup even on error
                {
                    let state = app_handle_clone.state::<AppState>();
                    let mut running = state.running_games.lock().unwrap();
                    running.remove(&game_path_clone);
                }
                let _ = app_handle_clone.emit("game-exited", &game_path_clone);
            }
        }
    });

    Ok(())
}
#[tauri::command]
fn toggle_favorite(app_handle: tauri::AppHandle, game_path: String) -> Result<bool, String> {
    let mut library = get_library_data(app_handle.clone());
    let entry = library.games.entry(game_path).or_insert(GamePersistentData {
        favorite: false,
        playtime: 0,
    });
    entry.favorite = !entry.favorite;
    let new_val = entry.favorite;
    save_library_data(app_handle, library)?;
    Ok(new_val)
}

#[tauri::command]
fn get_running_games(state: State<'_, AppState>) -> HashSet<String> {
    state.running_games.lock().unwrap().clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    info!("Initializing JArcade Backend...");

    tauri::Builder::default()
        .manage(AppState { running_games: Mutex::new(HashSet::new()) })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory, 
            launch_game,
            get_library_data,
            save_library_data,
            toggle_favorite,
            add_playtime,
            get_running_games
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
