-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_banned BOOLEAN DEFAULT FALSE,
    is_chat_muted BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT role_check CHECK (role IN ('user', 'junior-admin', 'admin', 'senior-admin', 'creator'))
);

-- Создание таблицы сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы текущего видео
CREATE TABLE IF NOT EXISTS current_video (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    vk_url TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы голосований
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Создание таблицы вариантов голосования
CREATE TABLE IF NOT EXISTS poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id),
    title VARCHAR(255) NOT NULL,
    vk_url TEXT NOT NULL,
    votes INTEGER DEFAULT 0
);

-- Создание таблицы голосов пользователей
CREATE TABLE IF NOT EXISTS user_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id),
    user_id INTEGER REFERENCES users(id),
    option_id INTEGER REFERENCES poll_options(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

-- Вставка дефолтного администратора
INSERT INTO users (username, password, role) VALUES 
('Создатель', 'admin123', 'creator')
ON CONFLICT (username) DO NOTHING;

-- Вставка дефолтного видео
INSERT INTO current_video (title, vk_url, description) VALUES 
('Добро пожаловать на VELSGOT', 'https://vk.com/video-12345_67890', 'Смотрите лучшие видео на нашей платформе!')
ON CONFLICT DO NOTHING;

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_poll_user ON user_votes(poll_id, user_id);
