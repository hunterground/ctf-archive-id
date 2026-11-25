use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashSet};
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;

const APP_SECRET: &[u8] = b"photocalc-premium-secret";
const USERNAME: &str = "admin_ocd";
const SECRET_XOR_KEY: u8 = 0x5a;
const SECRET_OBF: [u8; 11] = [
  0x39, 0x32, 0x28, 0x35, 0x37, 0x3b, 0x29, 0x32, 0x33, 0x3c, 0x2e,
];
const KEY_COUNT: usize = 100;
const LEVEL_COUNT: usize = 57;
const ORDER_SEED: u32 = 7867;
const SBOX: [u8; 256] = [
  0x94, 0x4D, 0xE5, 0xA1, 0x17, 0x29, 0xDA, 0x2A, 0xE7, 0xC4, 0x16, 0x76, 0x77, 0x63, 0x26, 0x22,
  0x19, 0x59, 0x89, 0x28, 0x39, 0x02, 0x18, 0xC6, 0x6C, 0x2C, 0xFE, 0x6D, 0xD7, 0xD4, 0x3C, 0x5A,
  0x24, 0xB2, 0x91, 0x90, 0x87, 0xA5, 0x43, 0xA0, 0x60, 0x9B, 0x78, 0xF1, 0xCA, 0x4F, 0x58, 0x7F,
  0x75, 0x8B, 0xE3, 0x5D, 0x67, 0x9D, 0x93, 0x84, 0x5B, 0xDC, 0x97, 0x35, 0x21, 0x04, 0xA8, 0x99,
  0x12, 0x2E, 0x64, 0xE8, 0x85, 0x71, 0xBF, 0x41, 0x7A, 0xBA, 0x38, 0x65, 0xD8, 0x2B, 0xC0, 0x7C,
  0x1A, 0x36, 0xDB, 0x40, 0x0A, 0xB8, 0xB4, 0xFC, 0xBB, 0xEC, 0xB3, 0x95, 0xC2, 0x3B, 0xFA, 0x25,
  0xAB, 0x0E, 0xC7, 0x8F, 0xC9, 0x9C, 0x7B, 0x5E, 0xC5, 0x30, 0x70, 0x4C, 0xB6, 0xDF, 0x6E, 0xA9,
  0x4B, 0xF2, 0xE6, 0x0D, 0x50, 0x66, 0x0F, 0xF7, 0xA3, 0x20, 0xEF, 0x80, 0x72, 0x53, 0xF9, 0x33,
  0x1D, 0x81, 0x49, 0x1B, 0x8D, 0x9A, 0xB1, 0xD3, 0x45, 0x9F, 0x3F, 0x88, 0x31, 0x2F, 0x3A, 0x27,
  0x13, 0xCB, 0x09, 0x56, 0xA2, 0x8C, 0x6F, 0xF8, 0xEB, 0x37, 0x54, 0x48, 0x00, 0x34, 0x7D, 0x11,
  0x92, 0x44, 0xE4, 0xC1, 0xA4, 0xED, 0xC8, 0xD1, 0xFB, 0x79, 0x32, 0xB5, 0x52, 0xF4, 0x8E, 0xFF,
  0x1E, 0x6A, 0xA7, 0xEA, 0x62, 0x42, 0x96, 0xE9, 0xD6, 0x0C, 0x2D, 0xD5, 0x15, 0xB9, 0x98, 0x5F,
  0x47, 0x4E, 0xC3, 0x46, 0x03, 0xCE, 0x08, 0x74, 0xFD, 0xCC, 0x01, 0xF6, 0x86, 0xF5, 0x4A, 0xCD,
  0x83, 0x69, 0x14, 0x9E, 0x23, 0xD0, 0xE2, 0xCF, 0xBD, 0xA6, 0xB7, 0xAA, 0x57, 0xDE, 0xBC, 0xB0,
  0xAE, 0x68, 0x73, 0x51, 0xF0, 0x07, 0x0B, 0x61, 0xAF, 0xE0, 0xDD, 0x82, 0x5C, 0x06, 0x7E, 0xD2,
  0x1C, 0xAD, 0x05, 0xAC, 0xF3, 0x55, 0xEE, 0x8A, 0xE1, 0x3E, 0x10, 0xD9, 0x1F, 0x3D, 0xBE, 0x6B,
];
const FLAG_CIPHER: [u8; 57] = [
  0x48, 0x29, 0xC3, 0xB9, 0xF1, 0x43, 0xFD, 0x81, 0xD9, 0xA2, 0x40, 0x6B, 0x9F, 0x87, 0xB4, 0x29,
  0x84, 0x80, 0x8B, 0xEB, 0xA5, 0x72, 0x6B, 0x90, 0x6C, 0xD7, 0xFA, 0x1F, 0x20, 0x1A, 0x9F, 0x33,
  0x1A, 0xCB, 0x79, 0xD7, 0xAC, 0x9A, 0x45, 0x00, 0x33, 0x16, 0xE5, 0x67, 0x8F, 0x93, 0x36, 0x37,
  0xD5, 0xBD, 0x8C, 0xF0, 0x5B, 0x73, 0x86, 0xB5, 0x38,
];


#[derive(Clone, Serialize, Deserialize)]
struct TokenPayload {
  sub: String,
  exp: i64,
  premium: bool,
}

#[derive(Serialize, Deserialize)]
struct SignedToken {
  payload: TokenPayload,
  sig: String,
}

#[derive(Serialize, Deserialize)]
struct LoginResponse {
  token: String,
  expires_in: i64,
}

#[derive(Clone, Serialize)]
struct GameQuestion {
  label: String,
  hint: String,
}

#[derive(Serialize)]
struct PremiumInfo {
  premium: bool,
  exp: i64,
  time_left: i64,
  session_id: u64,
}

#[derive(Serialize)]
struct GameStateResponse {
  premium: bool,
  time_left: i64,
  level: usize,
  total: usize,
  question: Option<GameQuestion>,
  complete: bool,
  flag: Option<String>,
  feedback: Option<String>,
}

struct AppState {
  premium_until: Option<i64>,
  premium_active: bool,
  session_id: u64,
  questions: Vec<GameQuestion>,
  answers: Vec<i64>,
  current_index: usize,
  used_keys: HashSet<String>,
}

impl AppState {
  fn new() -> Self {
    Self {
      premium_until: None,
      premium_active: false,
      session_id: now_unix().max(1) as u64,
      questions: build_questions(LEVEL_COUNT, ORDER_SEED),
      answers: Vec::new(),
      current_index: 0,
      used_keys: HashSet::new(),
    }
  }
}

fn now_unix() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or(Duration::from_secs(0))
    .as_secs() as i64
}

fn secret_string() -> String {
  let bytes: Vec<u8> = SECRET_OBF.iter().map(|b| b ^ SECRET_XOR_KEY).collect();
  String::from_utf8(bytes).unwrap_or_default()
}

fn hex_encode(bytes: &[u8]) -> String {
  let mut out = String::with_capacity(bytes.len() * 2);
  for byte in bytes {
    out.push_str(&format!("{:02x}", byte));
  }
  out
}

fn hash_key_hex(key: &str) -> String {
  let digest = Sha256::digest(key.as_bytes());
  hex_encode(&digest)
}


fn format_key(hex_digest: &str) -> String {
  let chunk = hex_digest.chars().take(8).collect::<String>().to_uppercase();
  format!("PCP-{}-{}", &chunk[0..4], &chunk[4..8])
}

fn mix_counter(counter: usize) -> usize {
  counter ^ 0x5a17
}

fn generate_key(counter: usize) -> String {
  let secret = secret_string();
  let mixed = mix_counter(counter);
  let raw = format!("{}:{}:{}", USERNAME, secret, mixed);
  let digest = Sha256::digest(raw.as_bytes());
  format_key(&hex_encode(&digest))
}

fn is_valid_key(candidate: &str) -> bool {
  let normalized = candidate.trim().to_uppercase();
  for counter in 0..KEY_COUNT {
    if generate_key(counter) == normalized {
      return true;
    }
  }
  false
}

fn shuffle_questions(mut items: Vec<GameQuestion>, seed: u32) -> Vec<GameQuestion> {
  let mut state = seed;
  let len = items.len();
  if len <= 1 {
    return items;
  }
  for i in (1..len).rev() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    let j = (state as usize) % (i + 1);
    items.swap(i, j);
  }
  items
}

fn build_questions(count: usize, seed: u32) -> Vec<GameQuestion> {
  let mut prng = 2048u32;
  let mut questions = Vec::with_capacity(count);
  for i in 0..count {
    prng = (prng * 9301 + 49297) % 233280;
    let a = 10 + (prng % 89);
    prng = (prng * 9301 + 49297) % 233280;
    let b = 5 + (prng % 40);
    let op = if i % 3 == 0 { "+" } else if i % 3 == 1 { "-" } else { "*" };
    let label = format!("{} {} {}", a, op, b);
    let hint = if op == "*" {
      "brightness curve"
    } else if op == "+" {
      "gamma lift"
    } else {
      "shadow clamp"
    };
    questions.push(GameQuestion {
      label,
      hint: hint.to_string(),
    });
  }
  shuffle_questions(questions, seed)
}

fn solve_label(label: &str) -> Option<i64> {
  let parts: Vec<&str> = label.split_whitespace().collect();
  if parts.len() != 3 {
    return None;
  }
  let left: i64 = parts[0].parse().ok()?;
  let right: i64 = parts[2].parse().ok()?;
  match parts[1] {
    "+" => Some(left + right),
    "-" => Some(left - right),
    "*" => Some(left * right),
    _ => None,
  }
}

fn derive_key(answers: &[i64], length: usize) -> Vec<u8> {
  let mut state: [u32; 16] = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  ];
  // Phase 1: Absorb answers into state via S-box substitution
  for (i, answer) in answers.iter().enumerate() {
    let mut v = (*answer as u32) ^ ((i as u32 + 1).wrapping_mul(0x9E3779B9));
    for r in 0..4usize {
      let j = (i * 4 + r) % 16;
      let sb = SBOX[(v & 0xFF) as usize] as u32;
      state[j] ^= sb.wrapping_mul(0x01010101);
      let rot = ((r * 7 + i * 3) % 31 + 1) as u32;
      state[j] = state[j].rotate_left(rot);
      state[j] = state[j].wrapping_add(state[(j + 5) % 16] ^ state[(j + 11) % 16]);
      v = v.wrapping_add(state[j]);
    }
  }
  // Phase 2: Avalanche mixing
  for r in 0..32usize {
    for j in 0..16usize {
      let rot = ((r * 3 + j * 5) % 31 + 1) as u32;
      state[j] ^= state[(j + 1) % 16].rotate_left(rot);
      state[j] = state[j].wrapping_add(state[(j + 7) % 16]);
    }
  }
  // Phase 3: Squeeze keystream through S-box
  let mut x = state[0] ^ state[7] ^ state[13];
  let mut out = vec![0u8; length];
  for k in 0..length {
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    x = x.wrapping_add(state[k % 16]);
    out[k] = SBOX[(x & 0xFF) as usize];
  }
  out
}

fn derive_flag(answers: &[i64]) -> Option<String> {
  if answers.len() < LEVEL_COUNT {
    return None;
  }
  let key = derive_key(answers, FLAG_CIPHER.len());
  let mut out = vec![0u8; FLAG_CIPHER.len()];
  for i in 0..FLAG_CIPHER.len() {
    out[i] = FLAG_CIPHER[i] ^ key[i];
  }
  String::from_utf8(out).ok()
}

fn build_game_response(state: &AppState, feedback: Option<String>) -> GameStateResponse {
  let total = state.questions.len();
  let current = state.current_index.min(total);
  let complete = current >= total;
  let question = if state.premium_active && !complete {
    state.questions.get(current).cloned()
  } else {
    None
  };
  let flag = if state.premium_active && complete {
    derive_flag(&state.answers)
  } else {
    None
  };
  let level = if total == 0 { 0 } else { (current + 1).min(total) };
  let exp = state.premium_until.unwrap_or(0);
  GameStateResponse {
    premium: state.premium_active,
    time_left: if state.premium_active { time_left(exp) } else { 0 },
    level,
    total,
    question,
    complete,
    flag,
    feedback,
  }
}

fn canonical_payload(payload: &TokenPayload) -> Result<String, String> {
  let mut map = BTreeMap::new();
  map.insert("exp", serde_json::Value::from(payload.exp));
  map.insert("premium", serde_json::Value::from(payload.premium));
  map.insert("sub", serde_json::Value::from(payload.sub.clone()));
  serde_json::to_string(&map).map_err(|err| err.to_string())
}

fn sign_payload(payload: &TokenPayload) -> Result<String, String> {
  let data = canonical_payload(payload)?;
  let mut mac = Hmac::<Sha256>::new_from_slice(APP_SECRET).map_err(|err| err.to_string())?;
  mac.update(data.as_bytes());
  let result = mac.finalize().into_bytes();
  Ok(URL_SAFE_NO_PAD.encode(result))
}

fn decode_token(token: &str) -> Result<SignedToken, String> {
  let decoded = URL_SAFE_NO_PAD
    .decode(token)
    .or_else(|_| base64::engine::general_purpose::URL_SAFE.decode(token))
    .map_err(|err| err.to_string())?;
  serde_json::from_slice(&decoded).map_err(|err| err.to_string())
}

fn verify_token(token: &str) -> Result<TokenPayload, String> {
  let signed = decode_token(token)?;
  let expected = sign_payload(&signed.payload)?;
  if signed.sig != expected {
    return Err("signature mismatch".into());
  }
  Ok(signed.payload)
}

fn time_left(exp: i64) -> i64 {
  let now = now_unix();
  if exp > now {
    exp - now
  } else {
    0
  }
}

#[tauri::command]
async fn login(
  app: AppHandle,
  state: State<'_, Mutex<AppState>>,
  username: String,
  license_key: String,
  server_url: String,
) -> Result<PremiumInfo, String> {
  if username.trim() != USERNAME {
    return Err("invalid username".into());
  }
  let normalized_key = license_key.trim().to_uppercase();
  if !is_valid_key(&normalized_key) {
    return Err("invalid license".into());
  }
  let key_hash = hash_key_hex(&normalized_key);
  {
    let guard = state.lock().map_err(|_| "state lock failed".to_string())?;
    if guard.used_keys.contains(&key_hash) {
      return Err("license already activated".into());
    }
  }
  let session_id = {
    let guard = state.lock().map_err(|_| "state lock failed".to_string())?;
    guard.session_id
  };
  let url = format!("{}/login", server_url.trim_end_matches('/'));
  let client = reqwest::Client::new();
  let response = client
    .post(url)
    .json(&serde_json::json!({
      "username": username.trim(),
      "key": normalized_key,
      "session_id": session_id.to_string()
    }))
    .send()
    .await
    .map_err(|err| err.to_string())?;

  if !response.status().is_success() {
    return Err("login failed".into());
  }

  let body = response.json::<LoginResponse>().await.map_err(|err| err.to_string())?;
  let payload = verify_token(&body.token)?;

  if !payload.premium {
    return Err("not premium".into());
  }

  let exp = payload.exp;
  {
    let mut guard = state.lock().map_err(|_| "state lock failed".to_string())?;
    guard.premium_until = Some(exp);
    guard.premium_active = true;
    if guard.questions.is_empty() {
      guard.questions = build_questions(LEVEL_COUNT, ORDER_SEED);
    }
    guard.used_keys.insert(key_hash.clone());
  }


  let app_handle = app.clone();
  tauri::async_runtime::spawn(async move {
    let wait = time_left(exp);
    if wait > 0 {
      sleep(Duration::from_secs(wait as u64)).await;
    }

    if let Ok(state) = app_handle.state::<Mutex<AppState>>().lock() {
      if !state.premium_active || state.session_id != session_id {
        return;
      }
    }

    let _ = app_handle.emit("premium-expired", "expired");

    if let Ok(mut state) = app_handle.state::<Mutex<AppState>>().lock() {
      if state.session_id != session_id {
        return;
      }
      state.premium_active = false;
      state.premium_until = None;
    }
  });

  Ok(PremiumInfo {
    premium: true,
    exp,
    time_left: time_left(exp),
    session_id,
  })
}

#[tauri::command]
fn premium_status(state: State<'_, Mutex<AppState>>) -> Result<PremiumInfo, String> {
  let guard = state.lock().map_err(|_| "state lock failed".to_string())?;
  let exp = guard.premium_until.unwrap_or(0);
  Ok(PremiumInfo {
    premium: guard.premium_active,
    exp,
    time_left: if guard.premium_active { time_left(exp) } else { 0 },
    session_id: guard.session_id,
  })
}

#[tauri::command]
fn game_state(state: State<'_, Mutex<AppState>>) -> Result<GameStateResponse, String> {
  let guard = state.lock().map_err(|_| "state lock failed".to_string())?;
  Ok(build_game_response(&guard, None))
}

#[tauri::command]
fn submit_answer(state: State<'_, Mutex<AppState>>, answer: i64) -> Result<GameStateResponse, String> {
  let mut guard = state.lock().map_err(|_| "state lock failed".to_string())?;
  if !guard.premium_active {
    return Ok(build_game_response(&guard, Some("Premium required to continue.".to_string())));
  }
  if guard.current_index >= guard.questions.len() {
    return Ok(build_game_response(&guard, None));
  }
  let label = &guard.questions[guard.current_index].label;
  let expected = solve_label(label).unwrap_or(0);
  if answer == expected {
    let index = guard.current_index;
    if index < guard.answers.len() {
      guard.answers[index] = answer;
    } else {
      guard.answers.push(answer);
    }
    guard.current_index = (index + 1).min(guard.questions.len());
    return Ok(build_game_response(&guard, Some("Correct. Proceeding...".to_string())));
  }
  Ok(build_game_response(&guard, Some("Incorrect. Try again.".to_string())))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(Mutex::new(AppState::new()))
    .invoke_handler(tauri::generate_handler![
      login,
      premium_status,
      game_state,
      submit_answer
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
