import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для работы с чатом: отправка, получение, удаление сообщений, управление чатом"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            text = body.get('text', '').strip()
            
            if not text:
                return response(400, {'error': 'Сообщение не может быть пустым'})
            
            cur.execute(
                "SELECT username, role, is_chat_muted FROM users WHERE id = %s",
                (user_id,)
            )
            user_data = cur.fetchone()
            
            if not user_data:
                return response(404, {'error': 'Пользователь не найден'})
            
            if user_data[2]:
                return response(403, {'error': 'Вам заблокирован чат'})
            
            cur.execute(
                "INSERT INTO messages (user_id, username, role, text, created_at) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
                (user_id, user_data[0], user_data[1], text, datetime.now())
            )
            message_data = cur.fetchone()
            conn.commit()
            
            return response(200, {
                'id': message_data[0],
                'username': user_data[0],
                'role': user_data[1],
                'text': text,
                'timestamp': message_data[1].isoformat()
            })
        
        elif method == 'GET':
            limit = int(event.get('queryStringParameters', {}).get('limit', 100))
            
            cur.execute(
                "SELECT id, username, role, text, created_at FROM messages ORDER BY created_at DESC LIMIT %s",
                (limit,)
            )
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': row[0],
                    'username': row[1],
                    'role': row[2],
                    'text': row[3],
                    'timestamp': row[4].isoformat()
                })
            
            messages.reverse()
            return response(200, messages)
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {})
            message_id = query_params.get('id')
            action = query_params.get('action')
            
            if action == 'clear':
                cur.execute("TRUNCATE TABLE messages RESTART IDENTITY")
                conn.commit()
                return response(200, {'success': True})
            
            if message_id:
                cur.execute("DELETE FROM messages WHERE id = %s", (int(message_id),))
                conn.commit()
                return response(200, {'success': True})
        
        return response(400, {'error': 'Неверный запрос'})
    
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
