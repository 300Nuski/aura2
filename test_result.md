#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Überarbeite das Design komplett. Ich möchte neue Modi (Dice, Mines, Coinflip) und alles funktionell haben. Crash-Animation fixen (Wackeln, grüner Strahl hört auf). Spielgeld-Casino AURA ROYALE mit E-Mail/Passwort-Login, Guthaben persistent."

backend:
  - task: "Auth (register/login/logout/me, cookies)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Ported + access token now 12h. Seeds: admin@auraroyale.de/AuraAdmin2026!, demo@auraroyale.de/Demo2026!"
  - task: "Wallet deposit POST /api/wallet/deposit (100-100000, auth)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Server-side $inc balance, logs transaction"
  - task: "Rounds: POST /api/rounds (stores user_name, meta), GET /api/rounds/mine, GET /api/rounds/recent (public), GET /api/leaderboard?range=24h|7d|all, GET /api/me/stats, GET /api/stats/public"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Aggregations via Mongo pipelines"
  - task: "Chat: GET /api/chat/messages, POST /api/chat/messages (auth, 1.2s rate limit), GET /api/chat/online, DELETE /api/admin/chat/{id}"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Real persisted chat"
  - task: "Admin: GET /api/admin/users (with rounds/wagered/profit), PUT role, PUT balance"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "403 for non-admins, self-demotion blocked"

frontend:
  - task: "Crash game (Canvas renderer, no wobble, beam anchored, bet/cashout/queue/cancel/auto mode)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/crash/CrashGame.jsx, frontend/src/components/crash/CrashGraphCanvas.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Dev override ?crashAt=NN forces crash point for testing long rounds"
  - task: "Dice game (/dice)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/dice/DiceGame.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Slider 2-98, over/under, 99/chance multiplier, roll animation ~0.7s"
  - task: "Mines game (/mines)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/mines/MinesGame.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "5x5 grid, mines 1-24, cashout after >=1 gem, random pick"
  - task: "Coinflip game (/coinflip) with streak (take/double)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/coinflip/CoinflipGame.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Flip animation 1.3s; phases idle/flipping/won/lost"
  - task: "Lobby redesign (Hero stats, GameGrid 7 games, LiveFeed real, Leaderboard real, Footer)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/Home.jsx, frontend/src/components/lobby/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "All cards route to working pages; no 'Demo folgt' toasts anymore"
  - task: "Shell: Topbar (balance, deposit, account dropdown), Sidebar (lg+), mobile Sheet sidebar, ChatPanel (2xl+ / Sheet), MobileNav"
    implemented: true
    working: "NA"
    file: "frontend/src/components/shell/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: ""
  - task: "AuthModal, DepositModal (server deposit), ProfilePage (/profile stats+history), AdminPage (/admin)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/AuthModal.jsx, DepositModal.jsx, pages/ProfilePage.jsx, pages/AdminPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: ""
  - task: "Roulette rebuilt (chips, number grid, outside bets, wheel spin, undo/double/clear, space to spin)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/roulette/RouletteGame.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Multi-bet, payouts: number 36x, dozen/column 3x, simple 2x; spin 4.6s"
  - task: "New games Plinko (/plinko canvas), Limbo (/limbo), Tower (/tower), Wheel (/wheel)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/plinko/PlinkoGame.jsx, limbo/LimboGame.jsx, tower/TowerGame.jsx, wheel/WheelGame.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Plinko ball animation ~1.5-2s; Wheel spin 4s; Limbo 0.9s"
  - task: "Daily bonus card in chat (GET/POST /api/wallet/daily-bonus, 24h cooldown, +500)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/shell/ChatPanel.jsx, backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: ""
  - task: "Info pages /info/:section, sidebar profile card + info links, crash full-viewport layout"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/InfoPage.jsx, frontend/src/components/shell/Sidebar.jsx"
    stuck_count: 0
    priority: "low"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: ""
  - task: "Blackjack, Sweet Bonanza pages restyled (legacy engines with token remap)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/BlackjackPage.jsx, SweetBonanzaPage.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: ""

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Crash game"
    - "Dice game"
    - "Mines game"
    - "Coinflip game"
    - "Auth + Deposit + Profile"
    - "Lobby LiveFeed/Leaderboard/Chat"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Full redesign + new games done. Please test backend endpoints and full frontend flows (guest + logged in demo user). Use ?crashAt=NN on /crash to force a long round if needed."
