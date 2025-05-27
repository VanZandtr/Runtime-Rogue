document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");
});

// Game state
const gameState = {
    currentValue: 0,
    goalValue: 10,
    round: 1,
    floor: 1,
    score: 0,
    lives: 3,
    maxLives: 3,
    availableBlocks: [],
    programBlocks: [],
    executionPointer: 0,
    isExecuting: false,
    executionSpeed: 800,
    executionTimer: null,
    selectedClass: null,
    gameOver: false,
    floorProgress: 0,
    floorGoal: 3,
    registers: { A: 0, B: 0, C: 0 },
    executionHistory: [],
    loopStack: [] // Fix for nested loops
};

// Block types with better organization
const blockTypes = {
    // Control Flow
    GOTO: 'goto',
    IF_GREATER: 'if_greater',
    IF_EQUAL: 'if_equal',
    IF_LESS: 'if_less',
    IF_THEN_GREATER: 'if_then_greater',
    IF_THEN_EQUAL: 'if_then_equal',
    IF_THEN_LESS: 'if_then_less',
    LOOP: 'loop',
    
    // Arithmetic
    ADD: 'add',
    SUBTRACT: 'subtract',
    MULTIPLY: 'multiply',
    DIVIDE: 'divide',
    MODULO: 'modulo',
    
    // Random/Chance
    DICE: 'dice',
    COIN: 'coin',
    RANDOM: 'random',
    LUCKY: 'lucky',
    
    // Advanced
    STORE: 'store',
    LOAD: 'load',
    DOUBLE: 'double',

    //Unique to Architect
    RECUR: 'recur'
};

// Character classes with more distinct abilities
const characterClasses = {
    HACKER: {
        name: 'Hacker',
        description: 'Masters of control flow and program manipulation. Starts with an extra block.',
        startingBlocks: [blockTypes.IF_THEN_GREATER, blockTypes.ADD, blockTypes.DOUBLE, blockTypes.IF_THEN_LESS],
        bonus: '',
        color: '#f38ba8'
    },
    MATHEMATICIAN: {
        name: 'Mathematician',
        description: 'Excels at arithmetic operations. Starts with higher goals for more points.',
        startingBlocks: [blockTypes.ADD, blockTypes.MULTIPLY, blockTypes.IF_THEN_LESS],
        bonus: 'score_multiplier',
        color: '#a6e3a1'
    },
    GAMBLER: {
        name: 'Gambler',
        description: 'Embraces chaos and chance. Starts with extra life and luck blocks.',
        startingBlocks: [blockTypes.DICE, blockTypes.COIN, blockTypes.IF_THEN_LESS],
        bonus: 'extra_life',
        color: '#cba6f7'
    },
    ARCHITECT: {
        name: 'Architect',
        description: 'Specializes in building complex and optimized structures. Gain access to unique blocks.',
        startingBlocks: [blockTypes.RECUR, blockTypes.ADD, blockTypes.MULTIPLY],
        bonus: 'extra_life',
        color: '#89CFF0'
    }
};

// Fixed block definitions with proper execution logic
const blockDefinitions = {
    [blockTypes.GOTO]: {
        name: 'GOTO',
        description: 'Jump to a specific line in your program',
        rarity: 'common',
        execute: (block, state) => {
            const targetLine = block.params.line;
            if (targetLine >= 1 && targetLine <= state.programBlocks.length) {
                state.executionPointer = targetLine - 1;
                return `Jumping to line ${targetLine}`;
            } else {
                return `Invalid jump target: line ${targetLine}`;
            }
        },
        createParams: (programLength = 3) => ({ 
            line: Math.floor(Math.random() * Math.max(1, Math.min(5, programLength))) + 1 
        })
    },
    
    [blockTypes.ADD]: {
        name: 'ADD',
        description: 'Add a value to current total',
        rarity: 'common',
        execute: (block, state) => {
            const value = block.params.value;
            state.currentValue += value;
            return `Added ${value}, total: ${state.currentValue}`;
        },
        createParams: () => ({ value: Math.floor(Math.random() * 3) + 3 })
    },
    
    [blockTypes.SUBTRACT]: {
        name: 'SUB',
        description: 'Subtract a value from current total',
        rarity: 'common',
        execute: (block, state) => {
            const value = block.params.value;
            state.currentValue -= value;
            return `Subtracted ${value}, total: ${state.currentValue}`;
        },
        createParams: () => ({ value: Math.floor(Math.random() * 4) + 1 })
    },
    
    [blockTypes.MULTIPLY]: {
        name: 'MUL',
        description: 'Multiply current value by amount',
        rarity: 'uncommon',
        execute: (block, state) => {
            const value = block.params.value;
            state.currentValue *= value;
            return `Multiplied by ${value}, total: ${state.currentValue}`;
        },
        createParams: () => ({ value: Math.floor(Math.random() * 3) + 2 })
    },
    
    [blockTypes.DIVIDE]: {
        name: 'DIV',
        description: 'Divide current value (rounded down)',
        rarity: 'uncommon',
        execute: (block, state) => {
            const value = block.params.value;
            if (value === 0) return 'Error: Division by zero';
            state.currentValue = Math.floor(state.currentValue / value);
            return `Divided by ${value}, total: ${state.currentValue}`;
        },
        createParams: () => ({ value: Math.floor(Math.random() * 3) + 2 })
    },
    
    [blockTypes.DICE]: {
        name: 'DICE',
        description: 'Roll dice and add result',
        rarity: 'common',
        execute: (block, state) => {
            const sides = block.params.sides;
            const count = block.params.count;
            let total = 0;
            const rolls = [];
            
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                rolls.push(roll);
                total += roll;
            }
            
            state.currentValue += total;
            return `Rolled ${count}d${sides}: [${rolls.join(', ')}] = +${total}, total: ${state.currentValue}`;
        },
        createParams: () => {
            const options = [
                { count: 1, sides: 6 },
                { count: 2, sides: 4 },
                { count: 1, sides: 8 },
                { count: 3, sides: 3 }
            ];
            return options[Math.floor(Math.random() * options.length)];
        }
    },
    
    [blockTypes.COIN]: {
        name: 'COIN',
        description: 'Flip coin: heads = add, tails = subtract',
        rarity: 'common',
        execute: (block, state) => {
            const value = block.params.value;
            const isHeads = Math.random() < 0.5;
            
            if (isHeads) {
                state.currentValue += value;
                return `Heads! Added ${value}, total: ${state.currentValue}`;
            } else {
                state.currentValue -= value;
                return `Tails! Subtracted ${value}, total: ${state.currentValue}`;
            }
        },
        createParams: () => ({ value: Math.floor(Math.random() * 4) + 2 })
    },
    
    [blockTypes.RANDOM]: {
        name: 'RNG',
        description: 'Add random value in range',
        rarity: 'uncommon',
        execute: (block, state) => {
            const min = block.params.min;
            const max = block.params.max;
            const value = Math.floor(Math.random() * (max - min + 1)) + min;
            state.currentValue += value;
            return `Random ${min}-${max}: +${value}, total: ${state.currentValue}`;
        },
        createParams: () => {
            const min = Math.floor(Math.random() * 3) + 1;
            const max = min + Math.floor(Math.random() * 8) + 3;
            return { min, max };
        }
    },
    
    [blockTypes.LUCKY]: {
        name: 'LUCKY',
        description: '30% chance for big bonus, 70% small bonus',
        rarity: 'rare',
        execute: (block, state) => {
            const isLucky = Math.random() < 0.3;
            const value = isLucky ? block.params.bigValue : block.params.smallValue;
            state.currentValue += value;
            return isLucky ? 
                `LUCKY! +${value}, total: ${state.currentValue}` :
                `Small luck: +${value}, total: ${state.currentValue}`;
        },
        createParams: () => ({
            smallValue: Math.floor(Math.random() * 3) + 1,
            bigValue: Math.floor(Math.random() * 8) + 8
        })
    },
    
    [blockTypes.IF_THEN_GREATER]: {
        name: 'IF > THEN',
        description: 'If current > threshold, add bonus value',
        rarity: 'rare',
        execute: (block, state) => {
            const threshold = block.params.threshold;
            const bonus = block.params.bonus;
            
            if (state.currentValue > threshold) {
                state.currentValue += bonus;
                return `${state.currentValue-bonus} > ${threshold}: TRUE, added bonus ${bonus}, total: ${state.currentValue}`;
            } else {
                return `${state.currentValue} > ${threshold}: FALSE, no bonus`;
            }
        },
        createParams: () => ({ 
            threshold: Math.floor(Math.random() * 10) + 5,
            bonus: Math.floor(Math.random() * 5) + 5
        })
    },
    
    [blockTypes.IF_THEN_EQUAL]: {
        name: 'IF=THEN',
        description: 'If current = target, multiply by bonus',
        rarity: 'rare',
        execute: (block, state) => {
            const target = block.params.target;
            const bonus = block.params.bonus;
            
            if (state.currentValue === target) {
                const oldValue = state.currentValue;
                state.currentValue *= bonus;
                return `${oldValue} = ${target}: TRUE, multiplied by ${bonus}, total: ${state.currentValue}`;
            } else {
                return `${state.currentValue} = ${target}: FALSE, no bonus`;
            }
        },
        createParams: () => ({ 
            target: Math.floor(Math.random() * 10) + 5,
            bonus: Math.floor(Math.random() * 2) + 2
        })
    },
    
    [blockTypes.IF_THEN_LESS]: {
        name: 'IF < THEN',
        description: 'If current < threshold, double current value',
        rarity: 'rare',
        execute: (block, state) => {
            const threshold = block.params.threshold;
            
            if (state.currentValue < threshold) {
                const oldValue = state.currentValue;
                state.currentValue *= 2;
                return `${oldValue} < ${threshold}: TRUE, doubled value, total: ${state.currentValue}`;
            } else {
                return `${state.currentValue} < ${threshold}: FALSE, no bonus`;
            }
        },
        createParams: () => ({ threshold: Math.floor(Math.random() * 10) + 10 })
    },
    
    [blockTypes.DOUBLE]: {
        name: 'DOUBLE',
        description: 'Double the current value',
        rarity: 'rare',
        execute: (block, state) => {
            const oldValue = state.currentValue;
            state.currentValue *= 2;
            return `Doubled ${oldValue} → ${state.currentValue}`;
        },
        createParams: () => ({})
    },
    
    [blockTypes.RECUR]: {
        name: 'RECURSION',
        description: 'Jump back to start and burn after one use',
        rarity: 'legendary',
        classRestriction: 'ARCHITECT',  // Only Architect class can use this
        oneTimeUse: true,  // This block will burn after use
        execute: (block, state) => {
            // Store the block ID before removing it
            const blockId = block.id;
            
            // Jump back to the beginning
            state.executionPointer = 0;
            
            // Find and remove this block from availableBlocks by ID
            const availableIndex = state.availableBlocks.findIndex(b => b.type === blockTypes.RECUR);
            if (availableIndex >= 0) {
                state.availableBlocks.splice(availableIndex, 1);
            }
            
            // Find and remove this block from programBlocks by ID
            const programIndex = state.programBlocks.findIndex(b => b.id === blockId);
            if (programIndex >= 0) {
                state.programBlocks.splice(programIndex, 1);
            }
            
            return `RECUR! Jumping back to start (Block burned)`;
        },
        createParams: () => ({})
    },
    
    [blockTypes.LOOP]: {
        name: 'LOOP',
        description: 'Repeat next line multiple times',
        rarity: 'uncommon',
        execute: (block, state) => {
            const count = block.params.count;
            
            // Check if we're at the end of the program
            if (state.executionPointer + 1 >= state.programBlocks.length) {
                return `Loop error: no line to repeat`;
            }
            
            // Find if this loop is already in the stack
            const loopIndex = state.loopStack.findIndex(loop => loop.startLine === state.executionPointer);
            
            if (loopIndex === -1) {
                // This is a new loop
                state.loopStack.push({
                    startLine: state.executionPointer,
                    remainingIterations: count,
                    targetLine: state.executionPointer + 1
                });
                return `Starting loop, repeating next line ${count} times`;
            } else {
                // This is a loop we're already processing
                const loop = state.loopStack[loopIndex];
                
                if (loop.remainingIterations > 1) {
                    // Still have iterations to go
                    loop.remainingIterations--;
                    // Don't change execution pointer - it will be incremented normally
                    // and then the next instruction will run again
                    return `Loop iteration ${count - loop.remainingIterations + 1} of ${count}`;
                } else {
                    // Loop is done
                    state.loopStack.splice(loopIndex, 1);
                    // Skip the next instruction since we're done looping
                    state.executionPointer++;
                    return `Loop complete`;
                }
            }
        },
        createParams: () => ({ count: Math.floor(Math.random() * 3) + 2 })
    },
    
    [blockTypes.STORE]: {
        name: 'STORE',
        description: 'Store current value in register',
        rarity: 'rare',
        execute: (block, state) => {
            const register = block.params.register;
            state.registers[register] = state.currentValue;
            return `Stored ${state.currentValue} in register ${register}`;
        },
        createParams: () => ({ register: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] })
    },
    
    [blockTypes.LOAD]: {
        name: 'LOAD',
        description: 'Load value from register',
        rarity: 'rare',
        execute: (block, state) => {
            const register = block.params.register;
            const value = state.registers[register] || 0;
            state.currentValue = value;
            return `Loaded ${value} from register ${register}`;
        },
        createParams: () => ({ register: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] })
    },
};

// DOM Elements
const elements = {
    goalValue: document.getElementById('goal-value'),
    currentValue: document.getElementById('current-value'),
    roundNumber: document.getElementById('round-number'),
    floorNumber: document.getElementById('floor-number'),
    scoreValue: document.getElementById('score-value'),
    livesContainer: document.getElementById('lives-container'),
    progressFill: document.getElementById('progress-fill'),
    availableBlocks: document.getElementById('available-blocks'),
    programBlocks: document.getElementById('program-blocks'),
    runProgram: document.getElementById('run-program'),
    resetProgram: document.getElementById('reset-program'),
    logContent: document.getElementById('log-content'),
    rewardModal: document.getElementById('reward-modal'),
    rewardChoices: document.getElementById('reward-choices')

};

// Initialize the game
function initGame() {
    showClassSelection();
}

// Show class selection screen
function showClassSelection() {
    const modal = document.createElement('div');
    modal.id = 'class-selection-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <h2>Choose Your Programming Style</h2>
        <p>Each class offers unique blocks and abilities:</p>
    `;
    
    const choices = document.createElement('div');
    choices.className = 'class-choices';
    
    Object.keys(characterClasses).forEach(classKey => {
        const classData = characterClasses[classKey];
        const classElement = document.createElement('div');
        classElement.className = 'class-choice';
        classElement.style.borderColor = classData.color;
        classElement.innerHTML = `
            <h3 style="color: ${classData.color}">${classData.name}</h3>
            <p>${classData.description}</p>
            <div class="class-blocks">
                ${classData.startingBlocks.map(blockType => 
                    `<div class="class-block-preview" style="border-left-color: ${classData.color}">
                        ${blockDefinitions[blockType].name}
                    </div>`
                ).join('')}
            </div>
        `;
        classElement.addEventListener('click', () => selectClass(classKey));
        choices.appendChild(classElement);
    });
    
    content.appendChild(choices);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Select a class and start the game
function selectClass(classKey) {
    gameState.selectedClass = classKey;
    document.getElementById('class-selection-modal').remove();
    
    const classData = characterClasses[classKey];
    
    // Create starting blocks
    gameState.availableBlocks = classData.startingBlocks.map(blockType => createBlock(blockType));
    
    // Apply class bonuses
    switch (classData.bonus) {
        case 'extra_block':
            gameState.executionSpeed = 600; // 25% faster
            break;
        case 'score_multiplier':
            gameState.goalValue = 15; // Higher starting goal
            break;
        case 'extra_life':
            gameState.lives = 4;
            gameState.maxLives = 4;
            break;
    }
    
    updateUI();
    setupEventListeners();
    addLogEntry(`Welcome, ${classData.name}! Your coding adventure begins...`);
}

// Create a new block with better parameter generation
function createBlock(type) {
    const definition = blockDefinitions[type];
    return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        name: definition.name,
        description: definition.description,
        rarity: definition.rarity,
        params: definition.createParams(gameState.programBlocks.length)
    };
}

// Update the UI to reflect the current game state
function updateUI() {
    elements.goalValue.textContent = gameState.goalValue;
    elements.currentValue.textContent = gameState.currentValue;
    elements.roundNumber.textContent = gameState.round;
    elements.floorNumber.textContent = gameState.floor;
    elements.scoreValue.textContent = gameState.score;
    
    // Update lives display
    updateLivesDisplay();
    
    // Update floor progress
    updateFloorProgress();
    
    // Render available blocks
    elements.availableBlocks.innerHTML = '';
    gameState.availableBlocks.forEach((block, index) => {
        const blockElement = createBlockElement(block, index);
        elements.availableBlocks.appendChild(blockElement);
    });
    
    // Render program blocks
    elements.programBlocks.innerHTML = '';
    gameState.programBlocks.forEach((block, index) => {
        const blockElement = createBlockElement(block, index, true);
        elements.programBlocks.appendChild(blockElement);
    });
}

// Update the lives display
function updateLivesDisplay() {
    elements.livesContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.maxLives; i++) {
        const heart = document.createElement('div');
        heart.className = 'life' + (i < gameState.lives ? '' : ' lost');
        heart.innerHTML = '❤';
        elements.livesContainer.appendChild(heart);
    }
}

// Update floor progress bar
function updateFloorProgress() {
    const progressPercent = (gameState.floorProgress / gameState.floorGoal) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;
}

// Create a DOM element for a code block
function createBlockElement(block, index, inProgram = false) {
    const blockElement = document.createElement('div');
    blockElement.className = `block rarity-${block.rarity}`;
    if (inProgram) {
        blockElement.className += ' program-block';
        
        // Add line number
        const lineNumber = document.createElement('div');
        lineNumber.className = 'line-number';
        lineNumber.textContent = index + 1;
        blockElement.appendChild(lineNumber);
    }
    blockElement.dataset.index = index;
    blockElement.dataset.id = block.id;
    
    let blockContent = `<div class="block-name">${block.name}</div>`;
    
    // Add parameters display based on block type
    let paramsText = '';
    if (block.params) {
        switch (block.type) {
            case blockTypes.GOTO:
                paramsText = `Line ${block.params.line}`;
                break;
            case blockTypes.ADD:
            case blockTypes.SUBTRACT:
            case blockTypes.MULTIPLY:
            case blockTypes.DIVIDE:
            case blockTypes.MODULO:
                paramsText = `${block.params.value}`;
                break;
            case blockTypes.DICE:
                paramsText = `${block.params.count}d${block.params.sides}`;
                break;
            case blockTypes.COIN:
                paramsText = `±${block.params.value}`;
                break;
            case blockTypes.RANDOM:
                paramsText = `${block.params.min}-${block.params.max}`;
                break;
            case blockTypes.LUCKY:
                paramsText = `${block.params.smallValue}/${block.params.bigValue}`;
                break;
            case blockTypes.IF_GREATER:
                paramsText = `> ${block.params.threshold}`;
                break;
            case blockTypes.IF_EQUAL:
                paramsText = `= ${block.params.target}`;
                break;
            case blockTypes.IF_LESS:
                paramsText = `< ${block.params.threshold}`;
                break;
            case blockTypes.IF_THEN_GREATER:
                paramsText = `>${block.params.threshold} +${block.params.bonus}`;
                break;
            case blockTypes.IF_THEN_EQUAL:
                paramsText = `=${block.params.target} ×${block.params.bonus}`;
                break;
            case blockTypes.IF_THEN_LESS:
                paramsText = `<${block.params.threshold} ×2`;
                break;
            case blockTypes.LOOP:
                paramsText = `${block.params.count}x`;
                break;
            case blockTypes.STORE:
            case blockTypes.LOAD:
                paramsText = `Reg ${block.params.register}`;
                break;
        }
    }
    
    if (paramsText) {
        blockContent += `<div class="block-params">${paramsText}</div>`;
    }
    
    blockContent += `<div class="block-description">${block.description}</div>`;
    blockElement.innerHTML += blockContent;
    
    // Add event listeners
    if (!inProgram && !gameState.isExecuting) {
        blockElement.addEventListener('click', () => addBlockToProgram(index));
    } else if (inProgram && !gameState.isExecuting) {
        blockElement.addEventListener('click', () => removeBlockFromProgram(index));
    }
    
    return blockElement;
}

// Add a block from available blocks to the program
function addBlockToProgram(index) {
    const block = { ...gameState.availableBlocks[index] };
    
    // Check if this block type is already in the program
    const blockTypeExists = gameState.programBlocks.some(programBlock => programBlock.type === block.type);
    
    // Check class restriction
    const definition = blockDefinitions[block.type];
    const isClassRestricted = definition.classRestriction && 
                             definition.classRestriction !== gameState.selectedClass;
    
    if (isClassRestricted) {
        addLogEntry(`Only ${definition.classRestriction} class can use this block!`, 'error');
        return;
    }
    
    if (!blockTypeExists) {
        gameState.programBlocks.push(block);
        
        // Handle one-time use blocks when added to program
        if (definition.oneTimeUse) {
            gameState.availableBlocks.splice(index, 1);
            addLogEntry(`Added ${block.name} to program (one-time use)`);
        } else {
            addLogEntry(`Added ${block.name} to program`);
        }
        
        updateUI();
    } else {
        addLogEntry(`You can only use one instance of each block type`, 'error');
    }
}

// Remove a block from the program
function removeBlockFromProgram(index) {
    const block = gameState.programBlocks[index];
    gameState.programBlocks.splice(index, 1);
    updateUI();
    addLogEntry(`Removed ${block.name} from program`);
}

// Fixed execution engine
function runProgram() {
    if (gameState.programBlocks.length === 0) {
        addLogEntry('Program is empty! Add some code blocks first.', 'error');
        return;
    }
    
    gameState.isExecuting = true;
    gameState.executionPointer = 0;
    gameState.currentValue = 0;
    gameState.loopStack = [];
    gameState.executionHistory = [];
    
    elements.runProgram.disabled = true;
    elements.resetProgram.disabled = true;
    
    clearLog();
    addLogEntry('=== PROGRAM START ===', 'info');
    updateUI();
    
    executeNextStep();
}

// Fixed execution step with proper control flow
function executeNextStep() {
    if (!gameState.isExecuting) return;
    
    // Check bounds and prevent infinite loops
    if (gameState.executionPointer >= gameState.programBlocks.length || 
        gameState.executionPointer < 0 || 
        gameState.executionHistory.length > 50) { // Prevent infinite loops
        
        if (gameState.executionHistory.length > 50) {
            addLogEntry('Program stopped: maximum execution steps reached', 'error');
        }
        endExecution();
        return;
    }
    
    const block = gameState.programBlocks[gameState.executionPointer];
    const definition = blockDefinitions[block.type];
    
    // Clear previous execution highlighting
    document.querySelectorAll('.program-block').forEach(el => el.classList.remove('executing'));
    
    // Highlight current block
    const blockElements = document.querySelectorAll('.program-block');
    if (blockElements[gameState.executionPointer]) {
        blockElements[gameState.executionPointer].classList.add('executing');
    }
    
    // Execute the block
    try {
        const result = definition.execute(block, gameState);
        addLogEntry(result);
        
        // Record execution for history
        gameState.executionHistory.push({
            pointer: gameState.executionPointer,
            block: block.type,
            result: result
        });
        
        // Update UI
        elements.currentValue.textContent = gameState.currentValue;
        
        // Check if goal is reached or exceeded
        if (gameState.currentValue >= gameState.goalValue) {
            addLogEntry('GOAL REACHED! Level complete!', 'success');
            
            // Calculate score based on floor and efficiency
            const baseScore = 100 * gameState.floor;
            const efficiencyBonus = Math.max(0, 10 - gameState.executionHistory.length) * 10;
            const scoreGain = baseScore + efficiencyBonus;
            
            gameState.score += scoreGain;
            gameState.floorProgress++;
            
            addLogEntry(`Gained ${scoreGain} points! (${baseScore} base + ${efficiencyBonus} efficiency)`, 'success');
            
            endExecution();
            setTimeout(() => showRewards(), 1500);
            return;
        }
        
        // Handle loop execution
        if (block.type === blockTypes.LOOP) {
            // Loop block handles its own pointer manipulation
            // If we have an active loop for the current instruction, we'll go back to the target
            const activeLoop = gameState.loopStack.find(loop => 
                loop.startLine === gameState.executionPointer && loop.remainingIterations > 1);
                
            if (activeLoop) {
                gameState.executionPointer = activeLoop.targetLine;
            } else {
                // Otherwise proceed normally
                gameState.executionPointer++;
            }
        } 
        // Move to next instruction (unless GOTO or IF changed the pointer)
        else if (!['goto', 'if_greater', 'if_equal', 'if_less'].includes(block.type)) {
            gameState.executionPointer++;
        }
        
        // If we've reached the end of the program and haven't hit the goal
        if (gameState.executionPointer >= gameState.programBlocks.length) {
            addLogEntry('Program ended without reaching the goal.', 'error');
            takeDamage(1);
            endExecution();
            return;
        }

        // Handle one-time use blocks
        if (definition.oneTimeUse) {
            // The block has already been removed from the arrays in its execute function
            // We just need to update the UI
            updateUI();
        }
        
        // Schedule next step
        gameState.executionTimer = setTimeout(executeNextStep, gameState.executionSpeed);
        
    } catch (error) {
        addLogEntry(`Execution error: ${error.message}`, 'error');
        endExecution();
    }
}

// End program execution
function endExecution() {
    gameState.isExecuting = false;
    elements.runProgram.disabled = false;
    elements.resetProgram.disabled = false;
    clearTimeout(gameState.executionTimer);
    
    // Clear execution highlighting
    document.querySelectorAll('.program-block').forEach(el => el.classList.remove('executing'));
    
    updateUI();
    addLogEntry('=== PROGRAM END ===', 'info');
}

// Reset the program
function resetProgram() {
    gameState.programBlocks = [];
    gameState.currentValue = 0;
    updateUI();
    clearLog();
    addLogEntry('Program cleared.', 'info');
}

// Take damage and check for game over
function takeDamage(amount) {
    gameState.lives -= amount;
    addLogEntry(`You took ${amount} damage! Lives remaining: ${gameState.lives}`, 'error');
    
    if (gameState.lives <= 0) {
        gameOver();
    }
    
    updateUI();
}

// Game over function
function gameOver() {
    gameState.gameOver = true;
    addLogEntry('GAME OVER! You ran out of lives.', 'error');
    
    // Create game over modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <h2>Game Over!</h2>
        <p>You reached floor ${gameState.floor} and scored ${gameState.score} points.</p>
        <button id="restart-game" class="btn">Start New Run</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('restart-game').addEventListener('click', () => {
        document.body.removeChild(modal);
        resetGame();
    });
}

// Reset the entire game for a new run
function resetGame() {
    gameState.currentValue = 0;
    gameState.goalValue = 10;
    gameState.round = 1;
    gameState.floor = 1;
    gameState.score = 0;
    gameState.lives = gameState.maxLives;
    gameState.programBlocks = [];
    gameState.gameOver = false;
    gameState.floorProgress = 0;
    gameState.registers = { A: 0, B: 0, C: 0 };
    
    // Reset to class selection
    showClassSelection();
}

// Add an entry to the execution log
function addLogEntry(message, type = '') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    if (type) entry.className += ` ${type}`;
    entry.textContent = message;
    elements.logContent.appendChild(entry);
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

// Clear the execution log
function clearLog() {
    elements.logContent.innerHTML = '';
}

// Show rewards after completing a level
function showRewards() {
    // Generate reward choices
    const rewards = [];
    
    // Add a new block type if not all types are available yet
    const availableTypes = gameState.availableBlocks.map(block => block.type);
    const allBlockTypes = Object.values(blockTypes);
    const missingTypes = allBlockTypes.filter(type => !availableTypes.includes(type));
    
    // Add block rewards (prioritize blocks from your class first)
    const classData = characterClasses[gameState.selectedClass];
    const classBlocks = classData.startingBlocks;
    const missingClassBlocks = classBlocks.filter(type => !availableTypes.includes(type));
    
    if (missingClassBlocks.length > 0) {
        const blockType = missingClassBlocks[0];
        rewards.push({
            type: 'new-block',
            blockType: blockType,
            title: `New ${blockDefinitions[blockType].name} Block`,
            description: blockDefinitions[blockType].description,
            rarity: blockDefinitions[blockType].rarity
        });
    } else if (missingTypes.length > 0) {
        // Offer blocks from other classes
        const blockType = missingTypes[Math.floor(Math.random() * missingTypes.length)];
        rewards.push({
            type: 'new-block',
            blockType: blockType,
            title: `New ${blockDefinitions[blockType].name} Block`,
            description: blockDefinitions[blockType].description,
            rarity: blockDefinitions[blockType].rarity
        });
    }
    
    // Add healing option if not at max health
    if (gameState.lives < gameState.maxLives) {
        rewards.push({
            type: 'heal',
            title: 'Restore Health',
            description: 'Heal 1 life point',
            rarity: 'uncommon'
        });
    }
    
    // Add max health increase (less common)
    if (Math.random() < 0.3) {
        rewards.push({
            type: 'max-health',
            title: 'Increase Max Health',
            description: '+1 maximum life',
            rarity: 'rare'
        });
    }
    
    // Add score bonus
    rewards.push({
        type: 'score-bonus',
        value: 50 * gameState.floor,
        title: 'Score Bonus',
        description: `+${50 * gameState.floor} points`,
        rarity: 'common'
    });
    
    // Add goal modifier
    if (Math.random() < 0.4) {
        rewards.push({
            type: 'goal-modifier',
            value: Math.floor(gameState.goalValue * 0.2),
            title: 'Easier Goal',
            description: `Reduce next goal by ${Math.floor(gameState.goalValue * 0.2)}`,
            rarity: 'uncommon'
        });
    }

    // Add special class-specific blocks (rare chance)
    if (Math.random() < 0.2) { // 20% chance
        if (gameState.selectedClass === 'ARCHITECT' && !availableTypes.includes(blockTypes.RECURSION)) {
            rewards.push({
                type: 'new-block',
                blockType: blockTypes.RECURSION,
                title: `New RECURSION Block`,
                description: `Jump back to start and burn after one use`,
                rarity: 'legendary'
            });
        }
    }
    
    // Randomly select 3 rewards (or fewer if not enough options)
    const selectedRewards = [];
    while (selectedRewards.length < 3 && rewards.length > 0) {
        const index = Math.floor(Math.random() * rewards.length);
        selectedRewards.push(rewards.splice(index, 1)[0]);
    }
    
    // Render reward choices
    elements.rewardChoices.innerHTML = '';
    selectedRewards.forEach((reward) => {
        const rewardElement = document.createElement('div');
        rewardElement.className = `reward-choice rarity-${reward.rarity || 'common'}`;
        rewardElement.innerHTML = `
            <div class="reward-title">${reward.title}</div>
            <div class="reward-description">${reward.description}</div>
        `;
        rewardElement.addEventListener('click', () => selectReward(reward));
        elements.rewardChoices.appendChild(rewardElement);
    });
    
    // Show modal
    elements.rewardModal.style.display = 'flex';
}

// Select a reward and start the next round
function selectReward(reward) {
    switch (reward.type) {
        case 'new-block':
            gameState.availableBlocks.push(createBlock(reward.blockType));
            addLogEntry(`Unlocked new ${blockDefinitions[reward.blockType].name} block!`, 'success');
            break;
        case 'heal':
            if (gameState.lives < gameState.maxLives) {
                gameState.lives++;
                addLogEntry(`Healed 1 life! Lives: ${gameState.lives}/${gameState.maxLives}`, 'success');
            }
            break;
        case 'max-health':
            gameState.maxLives++;
            gameState.lives++;
            addLogEntry(`Increased max health! Lives: ${gameState.lives}/${gameState.maxLives}`, 'success');
            break;
        case 'score-bonus':
            gameState.score += reward.value;
            addLogEntry(`Gained ${reward.value} bonus points!`, 'success');
            break;
        case 'goal-modifier':
            gameState.goalValue -= reward.value;
            if (gameState.goalValue < 5) gameState.goalValue = 5; // Minimum goal
            addLogEntry(`Next goal reduced to ${gameState.goalValue}`, 'success');
            break;
    }
    
    // Hide modal
    elements.rewardModal.style.display = 'none';
    
    // Check if floor is complete
    if (gameState.floorProgress >= gameState.floorGoal) {
        completeFloor();
    } else {
        // Start next round
        gameState.round++;
        gameState.programBlocks = [];
        gameState.currentValue = 0;
        gameState.goalValue = Math.floor(gameState.goalValue * 1.2);
        updateUI();
        addLogEntry(`Round ${gameState.round} started! Goal: ${gameState.goalValue}`, 'info');
    }
}

// Complete the current floor and move to the next
function completeFloor() {
    gameState.floor++;
    gameState.floorProgress = 0;
    gameState.round = 1;
    gameState.programBlocks = [];
    gameState.currentValue = 0;
    
    // Increase goal for the new floor
    gameState.goalValue = Math.floor(gameState.goalValue * 1.2);
    
    // Show floor completion modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <h2>Floor ${gameState.floor - 1} Complete!</h2>
        <p>You've advanced to floor ${gameState.floor}!</p>
        <p>Current score: ${gameState.score}</p>
        <button id="continue-game" class="btn">Continue</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('continue-game').addEventListener('click', () => {
        document.body.removeChild(modal);
        updateUI();
        addLogEntry(`Floor ${gameState.floor} started! Goal value is now ${gameState.goalValue}.`, 'info');
    });
}

// Setup event listeners
function setupEventListeners() {
    elements.runProgram.addEventListener('click', runProgram);
    elements.resetProgram.addEventListener('click', resetProgram);
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);