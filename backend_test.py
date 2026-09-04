#!/usr/bin/env python3
"""
AURA ROYALE Backend API Test Suite
Tests all endpoints against the public URL with httpOnly cookie auth
"""
import requests
import sys
import time
import random
import string
from datetime import datetime

BASE_URL = "https://green-beam-repair.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.user_id = None
        self.admin_session = requests.Session()
        
    def log(self, emoji, message):
        print(f"{emoji} {message}")
        
    def test(self, name, method, endpoint, expected_status, data=None, session=None, expect_json=True):
        """Run a single API test"""
        if session is None:
            session = self.session
        url = f"{BASE_URL}{endpoint}"
        self.tests_run += 1
        self.log("🔍", f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = session.get(url, timeout=10)
            elif method == 'POST':
                response = session.post(url, json=data, timeout=10)
            elif method == 'PUT':
                response = session.put(url, json=data, timeout=10)
            elif method == 'DELETE':
                response = session.delete(url, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log("✅", f"PASS - {name} (status: {response.status_code})")
                if expect_json:
                    try:
                        return True, response.json()
                    except:
                        return True, {}
                return True, response.text
            else:
                self.tests_failed += 1
                self.log("❌", f"FAIL - {name} (expected {expected_status}, got {response.status_code})")
                try:
                    self.log("📄", f"Response: {response.json()}")
                except:
                    self.log("📄", f"Response: {response.text[:200]}")
                return False, {}
                
        except Exception as e:
            self.tests_failed += 1
            self.log("❌", f"FAIL - {name} (error: {str(e)})")
            return False, {}
    
    def test_auth_flow(self):
        """Test authentication endpoints"""
        self.log("🔐", "=== TESTING AUTH ENDPOINTS ===")
        
        # Test register with random email
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        test_email = f"test_{random_suffix}@auraroyale.de"
        success, data = self.test(
            "POST /api/auth/register (new user)",
            "POST",
            "/auth/register",
            200,
            {"name": "Test User", "email": test_email, "password": "Test1234!"}
        )
        if success and data.get("id"):
            self.user_id = data["id"]
            self.log("✨", f"Created user: {data.get('email')} (id: {self.user_id})")
        
        # Test login with wrong password (should fail)
        self.test(
            "POST /api/auth/login (wrong password, should 401)",
            "POST",
            "/auth/login",
            401,
            {"email": "demo@auraroyale.de", "password": "WrongPassword123!"}
        )
        
        # Test login with demo user
        success, data = self.test(
            "POST /api/auth/login (demo user)",
            "POST",
            "/auth/login",
            200,
            {"email": "demo@auraroyale.de", "password": "Demo2026!"}
        )
        if success:
            self.log("✨", f"Logged in as: {data.get('email')} (balance: {data.get('balance')})")
        
        # Test GET /api/auth/me (with cookie)
        self.test(
            "GET /api/auth/me (authenticated)",
            "GET",
            "/auth/me",
            200
        )
        
        # Test logout
        self.test(
            "POST /api/auth/logout",
            "POST",
            "/auth/logout",
            200
        )
        
        # Test GET /api/auth/me after logout (should fail)
        self.test(
            "GET /api/auth/me (after logout, should 401)",
            "GET",
            "/auth/me",
            401
        )
        
        # Login again for subsequent tests
        self.test(
            "POST /api/auth/login (re-login demo)",
            "POST",
            "/auth/login",
            200,
            {"email": "demo@auraroyale.de", "password": "Demo2026!"}
        )
    
    def test_wallet(self):
        """Test wallet endpoints"""
        self.log("💰", "=== TESTING WALLET ENDPOINTS ===")
        
        # Get initial balance
        success, data = self.test(
            "GET /api/auth/balance",
            "GET",
            "/auth/balance",
            200
        )
        initial_balance = data.get("balance", 0) if success else 0
        self.log("💵", f"Initial balance: {initial_balance}")
        
        # Test valid deposit
        success, data = self.test(
            "POST /api/wallet/deposit (amount: 1000)",
            "POST",
            "/wallet/deposit",
            200,
            {"amount": 1000}
        )
        if success:
            new_balance = data.get("balance", 0)
            expected = initial_balance + 1000
            if new_balance == expected:
                self.log("✨", f"Balance increased correctly: {initial_balance} -> {new_balance}")
            else:
                self.log("⚠️", f"Balance mismatch: expected {expected}, got {new_balance}")
        
        # Test invalid deposit (amount too low)
        self.test(
            "POST /api/wallet/deposit (amount: 50, should 422)",
            "POST",
            "/wallet/deposit",
            422,
            {"amount": 50}
        )
        
        # Test invalid deposit (amount too high)
        self.test(
            "POST /api/wallet/deposit (amount: 200000, should 422)",
            "POST",
            "/wallet/deposit",
            422,
            {"amount": 200000}
        )
        
        # Test unauthenticated deposit
        temp_session = requests.Session()
        self.test(
            "POST /api/wallet/deposit (unauthenticated, should 401)",
            "POST",
            "/wallet/deposit",
            401,
            {"amount": 1000},
            session=temp_session
        )
        
        # Test daily bonus status
        success, data = self.test(
            "GET /api/wallet/daily-bonus",
            "GET",
            "/wallet/daily-bonus",
            200
        )
        if success:
            available = data.get("available", False)
            amount = data.get("amount", 0)
            self.log("✨", f"Daily bonus: available={available}, amount={amount}")
            
            # If available, claim it
            if available:
                success2, data2 = self.test(
                    "POST /api/wallet/daily-bonus (claim)",
                    "POST",
                    "/wallet/daily-bonus",
                    200
                )
                if success2:
                    self.log("✨", f"Claimed daily bonus: +{data2.get('amount', 0)}")
                    
                    # Try claiming again (should fail with 400)
                    self.test(
                        "POST /api/wallet/daily-bonus (already claimed, should 400)",
                        "POST",
                        "/wallet/daily-bonus",
                        400
                    )
            else:
                self.log("ℹ️", "Daily bonus not available (already claimed today)")
    
    def test_rounds(self):
        """Test rounds and stats endpoints"""
        self.log("🎮", "=== TESTING ROUNDS ENDPOINTS ===")
        
        # Test all 11 game names
        games = ["Crash", "Dice", "Mines", "Coinflip", "Plinko", "Limbo", "Tower", "Wheel", "Roulette", "Blackjack", "Sweet Bonanza"]
        for game in games:
            success, data = self.test(
                f"POST /api/rounds ({game})",
                "POST",
                "/rounds",
                200,
                {
                    "game": game,
                    "bet": 100,
                    "mult": 2.0,
                    "payout": 200,
                    "meta": {"test": True}
                }
            )
            if success and data.get("user_name"):
                self.log("✨", f"{game} round created with user_name: {data.get('user_name')}")
        
        # Get my rounds
        success, data = self.test(
            "GET /api/rounds/mine",
            "GET",
            "/rounds/mine?limit=10",
            200
        )
        if success and isinstance(data, list):
            self.log("✨", f"Retrieved {len(data)} rounds")
        
        # Get recent rounds (public, no auth needed)
        temp_session = requests.Session()
        success, data = self.test(
            "GET /api/rounds/recent (public)",
            "GET",
            "/rounds/recent?limit=10",
            200,
            session=temp_session
        )
        if success and isinstance(data, list):
            self.log("✨", f"Retrieved {len(data)} recent public rounds")
        
        # Get leaderboard (all time)
        success, data = self.test(
            "GET /api/leaderboard?range=all",
            "GET",
            "/leaderboard?range=all&limit=10",
            200,
            session=temp_session
        )
        if success and isinstance(data, list):
            self.log("✨", f"Leaderboard (all): {len(data)} entries")
        
        # Get leaderboard (24h)
        success, data = self.test(
            "GET /api/leaderboard?range=24h",
            "GET",
            "/leaderboard?range=24h&limit=10",
            200,
            session=temp_session
        )
        if success and isinstance(data, list):
            self.log("✨", f"Leaderboard (24h): {len(data)} entries")
        
        # Get leaderboard (7d)
        success, data = self.test(
            "GET /api/leaderboard?range=7d",
            "GET",
            "/leaderboard?range=7d&limit=10",
            200,
            session=temp_session
        )
        if success and isinstance(data, list):
            self.log("✨", f"Leaderboard (7d): {len(data)} entries")
        
        # Get my stats
        success, data = self.test(
            "GET /api/me/stats (authenticated)",
            "GET",
            "/me/stats",
            200
        )
        if success:
            total = data.get("total", {})
            self.log("✨", f"Stats: {total.get('rounds', 0)} rounds, {total.get('games', 0)} games, {total.get('deposits', {}).get('count', 0)} deposits")
        
        # Get public stats
        success, data = self.test(
            "GET /api/stats/public",
            "GET",
            "/stats/public",
            200,
            session=temp_session
        )
        if success:
            self.log("✨", f"Public stats: {data.get('players', 0)} players, {data.get('rounds_24h', 0)} rounds (24h)")
    
    def test_chat(self):
        """Test chat endpoints"""
        self.log("💬", "=== TESTING CHAT ENDPOINTS ===")
        
        # Get messages (public)
        temp_session = requests.Session()
        success, data = self.test(
            "GET /api/chat/messages (public)",
            "GET",
            "/chat/messages?limit=20",
            200,
            session=temp_session
        )
        if success and isinstance(data, list):
            self.log("✨", f"Retrieved {len(data)} chat messages")
        
        # Send message (authenticated)
        test_msg = f"Test message {int(time.time())}"
        success, data = self.test(
            "POST /api/chat/messages (authenticated)",
            "POST",
            "/chat/messages",
            200,
            {"text": test_msg}
        )
        if success and data.get("text") == test_msg:
            self.log("✨", f"Message sent: {data.get('text')}")
        
        # Test rate limit (immediate second post)
        self.test(
            "POST /api/chat/messages (rate limit, should 429)",
            "POST",
            "/chat/messages",
            429,
            {"text": "Another message"}
        )
        
        # Get online count
        success, data = self.test(
            "GET /api/chat/online",
            "GET",
            "/chat/online",
            200,
            session=temp_session
        )
        if success:
            self.log("✨", f"Online users: {data.get('online', 0)}")
    
    def test_admin(self):
        """Test admin endpoints"""
        self.log("👑", "=== TESTING ADMIN ENDPOINTS ===")
        
        # Test non-admin access (should fail)
        self.test(
            "GET /api/admin/users (as demo user, should 403)",
            "GET",
            "/admin/users",
            403
        )
        
        # Login as admin
        success, data = self.test(
            "POST /api/auth/login (admin)",
            "POST",
            "/auth/login",
            200,
            {"email": "admin@auraroyale.de", "password": "AuraAdmin2026!"},
            session=self.admin_session
        )
        if success:
            self.log("✨", f"Logged in as admin: {data.get('email')}")
        
        # Get users list
        success, data = self.test(
            "GET /api/admin/users (as admin)",
            "GET",
            "/admin/users",
            200,
            session=self.admin_session
        )
        if success and isinstance(data, list):
            self.log("✨", f"Retrieved {len(data)} users with rounds/wagered/profit fields")
            if len(data) > 0:
                user = data[0]
                has_fields = all(k in user for k in ["rounds", "wagered", "profit"])
                if has_fields:
                    self.log("✨", "User objects include rounds/wagered/profit fields")
                else:
                    self.log("⚠️", "User objects missing expected fields")
                
                # Test balance update
                test_user_id = user["id"]
                new_balance = 5000
                success2, _ = self.test(
                    f"PUT /api/admin/users/{test_user_id}/balance",
                    "PUT",
                    f"/admin/users/{test_user_id}/balance",
                    200,
                    {"balance": new_balance},
                    session=self.admin_session
                )
                
                # Test role update (for another user, not self)
                if len(data) > 1:
                    other_user_id = data[1]["id"]
                    success3, _ = self.test(
                        f"PUT /api/admin/users/{other_user_id}/role (to user)",
                        "PUT",
                        f"/admin/users/{other_user_id}/role",
                        200,
                        {"role": "user"},
                        session=self.admin_session
                    )
        
        # Test self-demotion (should fail)
        success, admin_data = self.admin_session.get(f"{BASE_URL}/auth/me").json(), None
        try:
            admin_data = self.admin_session.get(f"{BASE_URL}/auth/me").json()
            admin_id = admin_data.get("id")
            if admin_id:
                self.test(
                    "PUT /api/admin/users/{self}/role (self-demotion, should 400)",
                    "PUT",
                    f"/admin/users/{admin_id}/role",
                    400,
                    {"role": "user"},
                    session=self.admin_session
                )
        except:
            self.log("⚠️", "Could not test self-demotion (couldn't get admin ID)")
    
    def print_summary(self):
        """Print test summary"""
        self.log("📊", "=" * 50)
        self.log("📊", "TEST SUMMARY")
        self.log("📊", "=" * 50)
        self.log("📈", f"Total tests: {self.tests_run}")
        self.log("✅", f"Passed: {self.tests_passed}")
        self.log("❌", f"Failed: {self.tests_failed}")
        
        if self.tests_failed == 0:
            self.log("🎉", "ALL TESTS PASSED!")
            return 0
        else:
            success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
            self.log("⚠️", f"Success rate: {success_rate:.1f}%")
            return 1

def main():
    tester = APITester()
    
    print("=" * 50)
    print("🎰 AURA ROYALE Backend API Test Suite")
    print(f"🌐 Testing: {BASE_URL}")
    print("=" * 50)
    print()
    
    try:
        tester.test_auth_flow()
        tester.test_wallet()
        tester.test_rounds()
        tester.test_chat()
        tester.test_admin()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    print()
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
