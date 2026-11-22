CREATE DATABASE IF NOT EXISTS konoha_oracle;
USE konoha_oracle;

-- Clean up existing tables
DROP TABLE IF EXISTS fate_logs;
DROP TABLE IF EXISTS flag;

-- Flag table
CREATE TABLE flag (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metadata VARCHAR(255),
    flag_aing VARCHAR(255)
) ENGINE=InnoDB;

-- User results table
CREATE TABLE fate_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    prophecy TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO flag (metadata, flag_aing) VALUES 
('top_secret_record', 'ARKAV{t00_simple_for_plain_sql_injection_so_we_let_the_ai_hallucinate_the_payload}');

INSERT INTO fate_logs (session_id, prophecy) VALUES 
('system', 'In Konoha, logic is simple: 8x8 = 6 x 4.');

-- Apply Hardening: Restrict predictor_user permissions
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'predictor_user'@'%';
GRANT SELECT, INSERT ON konoha_oracle.* TO 'predictor_user'@'%';
FLUSH PRIVILEGES;