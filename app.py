from flask import Flask, render_template, request, jsonify, session
import random
import json
import time
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = 'ai_game_secret_key_2025'

class AIPlayer:
    def __init__(self, difficulty='medium'):
        self.difficulty = difficulty
        self.name = f"AI-{difficulty.upper()}"
        self.health = 100
        self.energy = 100
        self.skills = {
            'attack': self._get_skill_level(),
            'defense': self._get_skill_level(),
            'strategy': self._get_skill_level(),
            'adaptation': self._get_skill_level()
        }
        self.memory = []
        self.strategy_pattern = []
        
    def _get_skill_level(self):
        if self.difficulty == 'easy':
            return random.randint(30, 50)
        elif self.difficulty == 'medium':
            return random.randint(50, 75)
        else:  # hard
            return random.randint(75, 95)
    
    def analyze_opponent_pattern(self, opponent_moves):
        """AI learns from opponent's previous moves"""
        if len(opponent_moves) >= 3:
            recent_moves = opponent_moves[-3:]
            pattern_score = {}
            
            for move in ['attack', 'defend', 'special', 'heal']:
                pattern_score[move] = recent_moves.count(move)
            
            predicted_move = max(pattern_score, key=pattern_score.get)
            return predicted_move
        return None
    
    def make_decision(self, game_state, opponent_moves):
        """Advanced AI decision making"""
        predicted_opponent_move = self.analyze_opponent_pattern(opponent_moves)
        
        health_factor = self.health / 100
        energy_factor = self.energy / 100
        
        if self.health < 30 and self.energy >= 20:
            return 'heal'
        elif predicted_opponent_move == 'attack' and self.energy >= 15:
            return 'defend'
        elif predicted_opponent_move == 'defend' and self.energy >= 25:
            return 'special'
        elif self.energy >= 30 and health_factor > 0.6:
            return 'special'
        elif energy_factor > 0.5:
            return 'attack'
        else:
            return 'defend'

class GameEngine:
    def __init__(self):
        self.reset_game()
    
    def reset_game(self):
        self.player = {
            'health': 100,
            'energy': 100,
            'score': 0,
            'moves': []
        }
        self.ai_opponent = None
        self.turn_count = 0
        self.game_log = []
        self.game_id = str(uuid.uuid4())[:8]
    
    def start_new_game(self, difficulty='medium'):
        self.reset_game()
        self.ai_opponent = AIPlayer(difficulty)
        return {
            'game_id': self.game_id,
            'player': self.player,
            'ai': {
                'name': self.ai_opponent.name,
                'health': self.ai_opponent.health,
                'energy': self.ai_opponent.energy
            }
        }
    
    def process_turn(self, player_action):
        if not self.ai_opponent:
            return {'error': 'Game not started'}
        
        self.turn_count += 1
        
        ai_action = self.ai_opponent.make_decision(
            {'player_health': self.player['health'], 'player_energy': self.player['energy']},
            self.player['moves']
        )
        
        result = self._resolve_actions(player_action, ai_action)
        
        self.player['moves'].append(player_action)
        self.ai_opponent.memory.append(ai_action)
        
        turn_log = {
            'turn': self.turn_count,
            'player_action': player_action,
            'ai_action': ai_action,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        self.game_log.append(turn_log)
        
        game_status = self._check_game_status()
        
        return {
            'turn': self.turn_count,
            'player_action': player_action,
            'ai_action': ai_action,
            'result': result,
            'player': self.player,
            'ai': {
                'name': self.ai_opponent.name,
                'health': self.ai_opponent.health,
                'energy': self.ai_opponent.energy
            },
            'game_status': game_status,
            'log': turn_log
        }
    
    def _resolve_actions(self, player_action, ai_action):
        result = {
            'player_damage': 0,
            'ai_damage': 0,
            'player_heal': 0,
            'ai_heal': 0,
            'special_effects': []
        }
        
        effectiveness = {
            ('attack', 'attack'): (25, 25),
            ('attack', 'defend'): (10, 0),
            ('attack', 'special'): (30, 35),
            ('attack', 'heal'): (35, 0),
            ('defend', 'attack'): (0, 10),
            ('defend', 'defend'): (0, 0),
            ('defend', 'special'): (15, 20),
            ('defend', 'heal'): (0, 0),
            ('special', 'attack'): (35, 30),
            ('special', 'defend'): (20, 15),
            ('special', 'special'): (40, 40),
            ('special', 'heal'): (45, 0),
            ('heal', 'attack'): (0, 35),
            ('heal', 'defend'): (0, 0),
            ('heal', 'special'): (0, 45),
            ('heal', 'heal'): (0, 0)
        }
        
        player_dmg, ai_dmg = effectiveness.get((player_action, ai_action), (0, 0))
        
        if ai_dmg > 0:
            skill_modifier = self.ai_opponent.skills['attack'] / 100
            ai_dmg = int(ai_dmg * (0.8 + skill_modifier * 0.4))
            ai_dmg += random.randint(-5, 5)
        
        if player_dmg > 0:
            player_dmg += random.randint(-5, 5)
        
        self.player['health'] = max(0, self.player['health'] - ai_dmg)
        self.ai_opponent.health = max(0, self.ai_opponent.health - player_dmg)
        
        result['player_damage'] = ai_dmg
        result['ai_damage'] = player_dmg
        
        if player_action == 'heal':
            heal_amount = random.randint(20, 30)
            self.player['health'] = min(100, self.player['health'] + heal_amount)
            result['player_heal'] = heal_amount
            
        if ai_action == 'heal':
            heal_amount = random.randint(20, 30)
            self.ai_opponent.health = min(100, self.ai_opponent.health + heal_amount)
            result['ai_heal'] = heal_amount
        
        energy_cost = {'attack': 10, 'defend': 5, 'special': 25, 'heal': 20}
        self.player['energy'] = max(0, self.player['energy'] - energy_cost.get(player_action, 0))
        self.ai_opponent.energy = max(0, self.ai_opponent.energy - energy_cost.get(ai_action, 0))
        
        self.player['energy'] = min(100, self.player['energy'] + 5)
        self.ai_opponent.energy = min(100, self.ai_opponent.energy + 5)
        
        return result
    
    def _check_game_status(self):
        if self.player['health'] <= 0:
            return 'ai_wins'
        elif self.ai_opponent.health <= 0:
            self.player['score'] += 100 + (self.player['health'] * 2)
            return 'player_wins'
        elif self.turn_count >= 50:
            return 'draw'
        else:
            return 'ongoing'

game_engine = GameEngine()

@app.route('/')
def index():
    return render_template('game.html')

@app.route('/api/start_game', methods=['POST'])
def start_game():
    data = request.get_json()
    difficulty = data.get('difficulty', 'medium')
    
    game_state = game_engine.start_new_game(difficulty)
    session['game_id'] = game_state['game_id']
    
    return jsonify({
        'success': True,
        'game_state': game_state,
        'message': f'New game started against {game_state["ai"]["name"]}!'
    })

@app.route('/api/make_move', methods=['POST'])
def make_move():
    data = request.get_json()
    action = data.get('action')
    
    if not action or action not in ['attack', 'defend', 'special', 'heal']:
        return jsonify({'success': False, 'error': 'Invalid action'})
    
    energy_cost = {'attack': 10, 'defend': 5, 'special': 25, 'heal': 20}
    if game_engine.player['energy'] < energy_cost[action]:
        return jsonify({'success': False, 'error': 'Not enough energy'})
    
    result = game_engine.process_turn(action)
    
    if 'error' in result:
        return jsonify({'success': False, 'error': result['error']})
    
    return jsonify({
        'success': True,
        'result': result
    })

@app.route('/api/game_stats')
def game_stats():
    return jsonify({
        'game_id': game_engine.game_id,
        'turn_count': game_engine.turn_count,
        'game_log': game_engine.game_log[-10:],  # Last 10 turns
        'player': game_engine.player,
        'ai': {
            'name': game_engine.ai_opponent.name if game_engine.ai_opponent else None,
            'health': game_engine.ai_opponent.health if game_engine.ai_opponent else 0,
            'energy': game_engine.ai_opponent.energy if game_engine.ai_opponent else 0,
            'skills': game_engine.ai_opponent.skills if game_engine.ai_opponent else {}
        }
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
