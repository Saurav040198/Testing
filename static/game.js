class AIBattleGame {
    constructor() {
        this.gameState = null;
        this.selectedDifficulty = 'medium';
        this.isProcessingTurn = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDifficultySelection();
    }

    bindEvents() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedDifficulty = e.currentTarget.dataset.difficulty;
                this.updateDifficultySelection();
            });
        });

        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isProcessingTurn) {
                    const action = e.currentTarget.dataset.action;
                    this.makeMove(action);
                }
            });
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.showGameSetup();
        });

        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStats();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.showGameSetup();
        });

        document.getElementById('closeStats').addEventListener('click', () => {
            this.hideStats();
        });

        document.getElementById('statsModal').addEventListener('click', (e) => {
            if (e.target.id === 'statsModal') {
                this.hideStats();
            }
        });

        document.getElementById('gameOver').addEventListener('click', (e) => {
            if (e.target.id === 'gameOver') {
                this.showGameSetup();
            }
        });
    }

    updateDifficultySelection() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === this.selectedDifficulty) {
                btn.classList.add('active');
            }
        });
    }

    async startNewGame() {
        try {
            const response = await fetch('/api/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    difficulty: this.selectedDifficulty
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.gameState = data.game_state;
                this.showGameArena();
                this.updateGameDisplay();
                this.addLogEntry('system', data.message);
            } else {
                this.showError('Failed to start game: ' + data.error);
            }
        } catch (error) {
            this.showError('Network error: ' + error.message);
        }
    }

    async makeMove(action) {
        if (this.isProcessingTurn) return;

        const energyCost = { attack: 10, defend: 5, special: 25, heal: 20 };
        if (this.gameState.player.energy < energyCost[action]) {
            this.showError('Not enough energy for this action!');
            return;
        }

        this.isProcessingTurn = true;
        this.disableActionButtons();
        this.showAIThinking();

        try {
            const response = await fetch('/api/make_move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action })
            });

            const data = await response.json();
            
            if (data.success) {
                this.processGameResult(data.result);
            } else {
                this.showError('Move failed: ' + data.error);
            }
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.isProcessingTurn = false;
            this.hideAIThinking();
            this.enableActionButtons();
        }
    }

    processGameResult(result) {
        this.gameState.player = result.player;
        this.gameState.ai = result.ai;
        
        this.updateGameDisplay();
        this.updateTurnCounter(result.turn);
        
        this.addBattleLogEntry(result);
        
        if (result.game_status !== 'ongoing') {
            setTimeout(() => {
                this.endGame(result.game_status, result);
            }, 1000);
        }
    }

    addBattleLogEntry(result) {
        const actionNames = {
            attack: 'Attack',
            defend: 'Defend', 
            special: 'Special Attack',
            heal: 'Heal'
        };

        let playerMsg = `You used ${actionNames[result.player_action]}`;
        if (result.result.ai_damage > 0) {
            playerMsg += ` and dealt ${result.result.ai_damage} damage`;
        }
        if (result.result.player_heal > 0) {
            playerMsg += ` and healed ${result.result.player_heal} HP`;
        }
        this.addLogEntry('player', playerMsg);

        let aiMsg = `${result.ai.name} used ${actionNames[result.ai_action]}`;
        if (result.result.player_damage > 0) {
            aiMsg += ` and dealt ${result.result.player_damage} damage`;
        }
        if (result.result.ai_heal > 0) {
            aiMsg += ` and healed ${result.result.ai_heal} HP`;
        }
        this.addLogEntry('ai', aiMsg);
    }

    updateGameDisplay() {
        if (!this.gameState) return;

        this.updateHealthBar('player', this.gameState.player.health);
        this.updateEnergyBar('player', this.gameState.player.energy);
        document.getElementById('playerScore').textContent = this.gameState.player.score;

        this.updateHealthBar('ai', this.gameState.ai.health);
        this.updateEnergyBar('ai', this.gameState.ai.energy);
        document.getElementById('aiName').textContent = this.gameState.ai.name;

        this.updateActionButtons();
    }

    updateHealthBar(entity, health) {
        const healthBar = document.getElementById(`${entity}Health`);
        const healthText = document.getElementById(`${entity}HealthText`);
        
        healthBar.style.width = `${health}%`;
        healthText.textContent = `${health}/100`;
        
        if (health > 60) {
            healthBar.style.background = 'linear-gradient(90deg, #26de81, #20bf6b)';
        } else if (health > 30) {
            healthBar.style.background = 'linear-gradient(90deg, #f7b731, #fa8231)';
        } else {
            healthBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a24)';
        }
    }

    updateEnergyBar(entity, energy) {
        const energyBar = document.getElementById(`${entity}Energy`);
        const energyText = document.getElementById(`${entity}EnergyText`);
        
        energyBar.style.width = `${energy}%`;
        energyText.textContent = `${energy}/100`;
    }

    updateTurnCounter(turn) {
        document.getElementById('turnCount').textContent = turn;
    }

    updateActionButtons() {
        const energyCost = { attack: 10, defend: 5, special: 25, heal: 20 };
        const playerEnergy = this.gameState.player.energy;

        document.querySelectorAll('.action-btn').forEach(btn => {
            const action = btn.dataset.action;
            const cost = energyCost[action];
            
            if (playerEnergy < cost) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    }

    disableActionButtons() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = true;
        });
    }

    enableActionButtons() {
        this.updateActionButtons();
    }

    showAIThinking() {
        document.getElementById('aiThinking').style.display = 'block';
    }

    hideAIThinking() {
        document.getElementById('aiThinking').style.display = 'none';
    }

    addLogEntry(type, message) {
        const logContainer = document.getElementById('battleLog');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    endGame(status, result) {
        let title, message, stats;
        
        switch (status) {
            case 'player_wins':
                title = '🎉 Victory!';
                message = 'Congratulations! You defeated the AI opponent!';
                break;
            case 'ai_wins':
                title = '💀 Defeat';
                message = 'The AI opponent has bested you in battle!';
                break;
            case 'draw':
                title = '🤝 Draw';
                message = 'The battle ended in a stalemate!';
                break;
        }

        stats = `
            <div><strong>Final Score:</strong> ${this.gameState.player.score}</div>
            <div><strong>Turns Played:</strong> ${result.turn}</div>
            <div><strong>Your Health:</strong> ${this.gameState.player.health}/100</div>
            <div><strong>AI Health:</strong> ${this.gameState.ai.health}/100</div>
            <div><strong>Difficulty:</strong> ${this.selectedDifficulty.toUpperCase()}</div>
        `;

        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('finalStats').innerHTML = stats;
        
        this.showGameOver();
    }

    async showStats() {
        try {
            const response = await fetch('/api/game_stats');
            const data = await response.json();
            
            let statsHTML = `
                <div class="stats-section">
                    <h4>Current Game</h4>
                    <p><strong>Game ID:</strong> ${data.game_id}</p>
                    <p><strong>Turn:</strong> ${data.turn_count}</p>
                    <p><strong>Player Score:</strong> ${data.player.score}</p>
                </div>
            `;
            
            if (data.ai.name) {
                statsHTML += `
                    <div class="stats-section">
                        <h4>AI Opponent</h4>
                        <p><strong>Name:</strong> ${data.ai.name}</p>
                        <p><strong>Health:</strong> ${data.ai.health}/100</p>
                        <p><strong>Energy:</strong> ${data.ai.energy}/100</p>
                        <div class="ai-skills">
                            <h5>AI Skills:</h5>
                            <p>Attack: ${data.ai.skills.attack || 'N/A'}</p>
                            <p>Defense: ${data.ai.skills.defense || 'N/A'}</p>
                            <p>Strategy: ${data.ai.skills.strategy || 'N/A'}</p>
                            <p>Adaptation: ${data.ai.skills.adaptation || 'N/A'}</p>
                        </div>
                    </div>
                `;
            }
            
            if (data.game_log && data.game_log.length > 0) {
                statsHTML += `
                    <div class="stats-section">
                        <h4>Recent Battle Log</h4>
                        <div class="recent-log">
                `;
                
                data.game_log.forEach(log => {
                    statsHTML += `
                        <div class="log-item">
                            <strong>Turn ${log.turn}:</strong> 
                            Player: ${log.player_action}, AI: ${log.ai_action}
                        </div>
                    `;
                });
                
                statsHTML += `
                        </div>
                    </div>
                `;
            }
            
            document.getElementById('statsContent').innerHTML = statsHTML;
            document.getElementById('statsModal').style.display = 'flex';
            
        } catch (error) {
            this.showError('Failed to load stats: ' + error.message);
        }
    }

    hideStats() {
        document.getElementById('statsModal').style.display = 'none';
    }

    showGameSetup() {
        document.getElementById('gameSetup').style.display = 'block';
        document.getElementById('gameArena').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        this.clearBattleLog();
    }

    showGameArena() {
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('gameArena').style.display = 'block';
        document.getElementById('gameOver').style.display = 'none';
    }

    showGameOver() {
        document.getElementById('gameOver').style.display = 'flex';
    }

    clearBattleLog() {
        document.getElementById('battleLog').innerHTML = '';
    }

    showError(message) {
        this.addLogEntry('system', `❌ Error: ${message}`);
        console.error('Game Error:', message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIBattleGame();
});

document.addEventListener('DOMContentLoaded', () => {
    const createParticle = () => {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
            left: ${Math.random() * 100}vw;
            top: 100vh;
            animation: float-up ${3 + Math.random() * 4}s linear forwards;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 7000);
    };

    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-up {
            to {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        .stats-section {
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stats-section h4, .stats-section h5 {
            margin-bottom: 10px;
            color: #4ecdc4;
        }
        
        .ai-skills p {
            margin: 5px 0;
            font-size: 0.9rem;
        }
        
        .recent-log {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .log-item {
            padding: 8px;
            margin: 5px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);

    setInterval(createParticle, 500);
});
