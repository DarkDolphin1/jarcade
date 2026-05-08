use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::io::Read;
use log::{info, error, debug};
use zip::ZipArchive;
use base64::{Engine as _, engine::general_purpose};

#[derive(serde::Serialize)]
pub struct Game {
    name: String,
    path: String,
    icon: Option<String>, // Base64 encoded icon
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
            
            debug!("Found game: {} at {:?}", name, path_buf);
            
            games.push(Game {
                name,
                path: path_buf.to_string_lossy().to_string(),
                icon,
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
