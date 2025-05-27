# Code Roguelite

A programming-based roguelite game where you combine code blocks to solve puzzles and progress through increasingly difficult challenges.

## 🎮 Demo Link
https://rawcdn.githack.com/VanZandtr/Runtime-Rogue/8c7a90678c054a772cebb40acfd0ac21d88e2ed3/docs/improved_code_roguelite.html

## 🚀 Features

### 🧩 Block-Based Programming
- Combine different code blocks to create programs
- Execute your program to reach target values
- Blocks have different rarities and effects

### 👨‍💻 Character Classes
- **🔍 Hacker**: Masters of control flow that have hacked the game to add another starting block
- **🧮 Mathematician**: Excels at arithmetic operations with higher scoring potential
- **🎲 Gambler**: Embraces chaos with extra life and luck-based blocks
- **🏗️ Architect**: Specializes in complex structures with unique blocks

### 🏆 Progression System
- Complete rounds to progress through floors
- Increasing difficulty with higher goal values
- Earn rewards after each successful round
- Score points based on efficiency and floor level

### 🎁 Rewards
- Unlock new code blocks
- Heal damage
- Increase maximum health
- Earn score bonuses
- Reduce goal difficulty

### 📚 Block Library

#### Control Flow Blocks
- **GOTO**: Jump to a specific line in your program
- **IF>**: Execute next line only if current > threshold
- **IF=**: Execute next line only if current equals target
- **IF<**: Execute next line only if current < threshold
- **LOOP**: Repeat next line multiple times
- **RECUR**: Jump back to start and burn after one use (Architect only)

#### Arithmetic Blocks
- **ADD**: Add a value to current total
- **SUB**: Subtract a value from current total
- **MUL**: Multiply current value by amount
- **DIV**: Divide current value (rounded down)
- **MODULO**: Remainder after division
- **DOUBLE**: Double the current value

#### Random/Chance Blocks
- **DICE**: Roll dice and add result
- **COIN**: Flip coin: heads = add, tails = subtract
- **RNG**: Add random value in range
- **LUCKY**: 30% chance for big bonus, 70% small bonus

#### Conditional Bonus Blocks
- **IF>THEN**: If current > threshold, add bonus value
- **IF=THEN**: If current = target, multiply by bonus
- **IF<THEN**: If current < threshold, double current value

#### Advanced Blocks
- **STORE**: Store current value in register
- **LOAD**: Load value from register

## 🎯 How to Play
1. Choose a character class
2. Add blocks to your program
3. Run your program to reach or exceed the goal value
4. Choose rewards after successful rounds
5. Progress through floors with increasing difficulty
6. Try to achieve the highest score possible!

## 🛠️ Technical Details
- Built with HTML, CSS, and JavaScript
- No external dependencies
- Responsive design works on desktop and mobile
- Includes safety features to prevent infinite loops

## 🎨 Visual Features
- Distinctive color scheme for each character class
- Block rarity indicated by border colors
- Animated execution highlighting
- Clean, modern UI with gradients and animations
