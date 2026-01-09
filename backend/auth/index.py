import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для работы с пользователями: регистрация, вход, управление ролями, баны"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                username = body.get('username', '').strip()
                password = body.get('password', '').strip()
                
                if not username or not password:
                    return response(400, {'error': 'Заполните все поля'})
                
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return response(400, {'error': 'Пользователь уже существует'})
                
                cur.execute(
                    "INSERT INTO users (username, password, role) VALUES (%s, %s, 'user') RETURNING id, username, role, is_banned, is_chat_muted",
                    (username, password)
                )
                user_data = cur.fetchone()
                conn.commit()
                
                return response(200, {
                    'id': user_data[0],
                    'username': user_data[1],
                    'role': user_data[2],
                    'isBanned': user_data[3],
                    'isChatMuted': user_data[4]
                })
            
            elif action == 'login':
                username = body.get('username', '').strip()
                password = body.get('password', '').strip()
                
                cur.execute(
                    "SELECT id, username, role, is_banned, is_chat_muted FROM users WHERE username = %s AND password = %s",
                    (username, password)
                )
                user_data = cur.fetchone()
                
                if not user_data:
                    return response(401, {'error': 'Неверный логин или пароль'})
                
                if user_data[3]:
                    return response(403, {'error': 'Вы забанены'})
                
                cur.execute("UPDATE users SET is_online = TRUE, last_seen = %s WHERE id = %s", (datetime.now(), user_data[0]))
                conn.commit()
                
                return response(200, {
                    'id': user_data[0],
                    'username': user_data[1],
                    'role': user_data[2],
                    'isBanned': user_data[3],
                    'isChatMuted': user_data[4]
                })
        
        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            
            if action == 'list' or not action:
                cur.execute(
                    "SELECT id, username, role, is_banned, is_chat_muted, is_online FROM users ORDER BY created_at"
                )
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'username': row[1],
                        'role': row[2],
                        'isBanned': row[3],
                        'isChatMuted': row[4],
                        'isOnline': row[5]
                    })
                return response(200, users)
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            action = body.get('action')
            
            if action == 'toggle_chat_mute':
                cur.execute("UPDATE users SET is_chat_muted = NOT is_chat_muted WHERE id = %s RETURNING is_chat_muted", (user_id,))
                new_state = cur.fetchone()[0]
                conn.commit()
                return response(200, {'isChatMuted': new_state})
            
            elif action == 'toggle_ban':
                cur.execute("UPDATE users SET is_banned = NOT is_banned, is_online = FALSE WHERE id = %s RETURNING is_banned", (user_id,))
                new_state = cur.fetchone()[0]
                conn.commit()
                return response(200, {'isBanned': new_state})
            
            elif action == 'change_role':
                new_role = body.get('role')
                if new_role not in ['user', 'junior-admin', 'admin', 'senior-admin', 'creator']:
                    return response(400, {'error': 'Неверная роль'})
                
                cur.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, user_id))
                conn.commit()
                return response(200, {'role': new_role})
            
            elif action == 'set_offline':
                cur.execute("UPDATE users SET is_online = FALSE, last_seen = %s WHERE id = %s", (datetime.now(), user_id))
                conn.commit()
                return response(200, {'success': True})
        
        return response(200, {'message': 'OK'})
    
    except Exception as e:
        return response(500, {'error': str(e)})
    
    finally:
        cur.close()
        conn.close()

def response(status_code: int, data: dict) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False)
    }