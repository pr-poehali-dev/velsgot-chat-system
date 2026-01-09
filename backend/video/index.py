import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для управления видео и голосованиями"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            
            if not action:
                return response(200, {'message': 'OK'})
            
            if action == 'current_video':
                cur.execute("SELECT id, title, vk_url, description FROM current_video ORDER BY id DESC LIMIT 1")
                video = cur.fetchone()
                if video:
                    return response(200, {
                        'id': video[0],
                        'title': video[1],
                        'vkUrl': video[2],
                        'description': video[3]
                    })
                return response(404, {'error': 'Видео не найдено'})
            
            elif action == 'active_poll':
                cur.execute("SELECT id FROM polls WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1")
                poll = cur.fetchone()
                
                if not poll:
                    return response(200, {'active': False})
                
                poll_id = poll[0]
                cur.execute(
                    "SELECT id, title, vk_url, votes FROM poll_options WHERE poll_id = %s",
                    (poll_id,)
                )
                options = []
                for row in cur.fetchall():
                    options.append({
                        'id': row[0],
                        'title': row[1],
                        'vkUrl': row[2],
                        'votes': row[3]
                    })
                
                return response(200, {
                    'active': True,
                    'pollId': poll_id,
                    'options': options
                })
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'change_video':
                title = body.get('title', '').strip()
                vk_url = body.get('vkUrl', '').strip()
                description = body.get('description', '').strip()
                
                if not title or not vk_url:
                    return response(400, {'error': 'Заполните все поля'})
                
                cur.execute(
                    "INSERT INTO current_video (title, vk_url, description, updated_at) VALUES (%s, %s, %s, %s) RETURNING id",
                    (title, vk_url, description, datetime.now())
                )
                video_id = cur.fetchone()[0]
                conn.commit()
                
                return response(200, {
                    'id': video_id,
                    'title': title,
                    'vkUrl': vk_url,
                    'description': description
                })
            
            elif action == 'create_poll':
                options = body.get('options', [])
                
                if len(options) < 2:
                    return response(400, {'error': 'Минимум 2 варианта'})
                
                cur.execute("UPDATE polls SET is_active = FALSE, ended_at = %s WHERE is_active = TRUE", (datetime.now(),))
                
                cur.execute("INSERT INTO polls (is_active, created_at) VALUES (TRUE, %s) RETURNING id", (datetime.now(),))
                poll_id = cur.fetchone()[0]
                
                for option in options:
                    cur.execute(
                        "INSERT INTO poll_options (poll_id, title, vk_url, votes) VALUES (%s, %s, %s, 0)",
                        (poll_id, option['title'], option['vkUrl'])
                    )
                
                conn.commit()
                return response(200, {'pollId': poll_id, 'success': True})
            
            elif action == 'vote':
                user_id = body.get('userId')
                option_id = body.get('optionId')
                
                cur.execute("SELECT poll_id FROM poll_options WHERE id = %s", (option_id,))
                poll_data = cur.fetchone()
                if not poll_data:
                    return response(404, {'error': 'Вариант не найден'})
                
                poll_id = poll_data[0]
                
                cur.execute("SELECT id FROM user_votes WHERE poll_id = %s AND user_id = %s", (poll_id, user_id))
                if cur.fetchone():
                    return response(400, {'error': 'Вы уже проголосовали'})
                
                cur.execute(
                    "INSERT INTO user_votes (poll_id, user_id, option_id, created_at) VALUES (%s, %s, %s, %s)",
                    (poll_id, user_id, option_id, datetime.now())
                )
                cur.execute("UPDATE poll_options SET votes = votes + 1 WHERE id = %s", (option_id,))
                conn.commit()
                
                return response(200, {'success': True})
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'end_poll':
                cur.execute("UPDATE polls SET is_active = FALSE, ended_at = %s WHERE is_active = TRUE", (datetime.now(),))
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