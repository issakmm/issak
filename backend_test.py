import requests
import sys
import json
from datetime import datetime

class NearbyTalkAPITester:
    def __init__(self, base_url="https://nearby-talk-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    if 'detail' in error_data:
                        details += f" - {error_data['detail']}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_register_invalid_email(self):
        """Test registration with non-.edu email"""
        return self.run_test(
            "Register Invalid Email",
            "POST",
            "auth/register",
            400,
            data={
                "email": "test@gmail.com",
                "password": "testpass123",
                "city": "San Francisco"
            }
        )

    def test_register_valid_user(self):
        """Test registration with valid .edu email"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test{timestamp}@stanford.edu"
        
        success, response = self.run_test(
            "Register Valid User",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "city": "San Francisco"
            }
        )
        
        if success and 'verification_code' in response:
            self.test_email = test_email
            self.test_password = "testpass123"
            self.verification_code = response['verification_code']
            return True, response
        
        return success, response

    def test_verify_email_invalid_code(self):
        """Test email verification with invalid code"""
        if not hasattr(self, 'test_email'):
            self.log_test("Verify Invalid Code", False, "No test email available")
            return False, {}
            
        return self.run_test(
            "Verify Invalid Code",
            "POST",
            "auth/verify",
            400,
            data={
                "email": self.test_email,
                "code": "000000"
            }
        )

    def test_verify_email_valid_code(self):
        """Test email verification with valid code"""
        if not hasattr(self, 'test_email') or not hasattr(self, 'verification_code'):
            self.log_test("Verify Valid Code", False, "No test email or verification code available")
            return False, {}
            
        success, response = self.run_test(
            "Verify Valid Code",
            "POST",
            "auth/verify",
            200,
            data={
                "email": self.test_email,
                "code": self.verification_code
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response['user']
            return True, response
        
        return success, response

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Login Invalid Credentials",
            "POST",
            "auth/login",
            401,
            data={
                "email": "nonexistent@stanford.edu",
                "password": "wrongpass"
            }
        )

    def test_login_valid_credentials(self):
        """Test login with valid credentials"""
        if not hasattr(self, 'test_email'):
            self.log_test("Login Valid Credentials", False, "No test email available")
            return False, {}
            
        success, response = self.run_test(
            "Login Valid Credentials",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_email,
                "password": self.test_password
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response['user']
            return True, response
        
        return success, response

    def test_get_me(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Get Me", False, "No auth token available")
            return False, {}
            
        return self.run_test("Get Me", "GET", "auth/me", 200)

    def test_create_post_empty_content(self):
        """Test creating post with empty content"""
        if not self.token:
            self.log_test("Create Post Empty", False, "No auth token available")
            return False, {}
            
        return self.run_test(
            "Create Post Empty",
            "POST",
            "posts",
            400,
            data={
                "content": "",
                "feed_type": "university"
            }
        )

    def test_create_post_too_long(self):
        """Test creating post with content too long"""
        if not self.token:
            self.log_test("Create Post Too Long", False, "No auth token available")
            return False, {}
            
        long_content = "x" * 501  # Over 500 character limit
        return self.run_test(
            "Create Post Too Long",
            "POST",
            "posts",
            400,
            data={
                "content": long_content,
                "feed_type": "university"
            }
        )

    def test_create_university_post(self):
        """Test creating a valid university post"""
        if not self.token:
            self.log_test("Create University Post", False, "No auth token available")
            return False, {}
            
        success, response = self.run_test(
            "Create University Post",
            "POST",
            "posts",
            200,
            data={
                "content": "Test university post content",
                "feed_type": "university"
            }
        )
        
        if success and 'id' in response:
            self.university_post_id = response['id']
            return True, response
        
        return success, response

    def test_create_city_post(self):
        """Test creating a valid city post"""
        if not self.token:
            self.log_test("Create City Post", False, "No auth token available")
            return False, {}
            
        success, response = self.run_test(
            "Create City Post",
            "POST",
            "posts",
            200,
            data={
                "content": "Test city post content",
                "feed_type": "city"
            }
        )
        
        if success and 'id' in response:
            self.city_post_id = response['id']
            return True, response
        
        return success, response

    def test_get_university_posts(self):
        """Test getting university feed posts"""
        if not self.token:
            self.log_test("Get University Posts", False, "No auth token available")
            return False, {}
            
        return self.run_test("Get University Posts", "GET", "posts?feed_type=university&sort=new", 200)

    def test_get_city_posts(self):
        """Test getting city feed posts"""
        if not self.token:
            self.log_test("Get City Posts", False, "No auth token available")
            return False, {}
            
        return self.run_test("Get City Posts", "GET", "posts?feed_type=city&sort=new", 200)

    def test_get_hot_posts(self):
        """Test getting hot posts"""
        if not self.token:
            self.log_test("Get Hot Posts", False, "No auth token available")
            return False, {}
            
        return self.run_test("Get Hot Posts", "GET", "posts?feed_type=university&sort=hot", 200)

    def test_get_single_post(self):
        """Test getting a single post"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Get Single Post", False, "No auth token or post ID available")
            return False, {}
            
        return self.run_test("Get Single Post", "GET", f"posts/{self.university_post_id}", 200)

    def test_vote_post_upvote(self):
        """Test upvoting a post"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Vote Post Upvote", False, "No auth token or post ID available")
            return False, {}
            
        return self.run_test(
            "Vote Post Upvote",
            "POST",
            f"posts/{self.university_post_id}/vote",
            200,
            data={"vote": 1}
        )

    def test_vote_post_downvote(self):
        """Test downvoting a post"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Vote Post Downvote", False, "No auth token or post ID available")
            return False, {}
            
        return self.run_test(
            "Vote Post Downvote",
            "POST",
            f"posts/{self.university_post_id}/vote",
            200,
            data={"vote": -1}
        )

    def test_vote_post_remove(self):
        """Test removing vote from a post"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Vote Post Remove", False, "No auth token or post ID available")
            return False, {}
            
        return self.run_test(
            "Vote Post Remove",
            "POST",
            f"posts/{self.university_post_id}/vote",
            200,
            data={"vote": 0}
        )

    def test_create_comment_empty(self):
        """Test creating comment with empty content"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Create Comment Empty", False, "No auth token or post ID available")
            return False, {}
            
        return self.run_test(
            "Create Comment Empty",
            "POST",
            f"posts/{self.university_post_id}/comments",
            400,
            data={"content": ""}
        )

    def test_create_comment_too_long(self):
        """Test creating comment with content too long"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Create Comment Too Long", False, "No auth token or post ID available")
            return False, {}
            
        long_content = "x" * 301  # Over 300 character limit
        return self.run_test(
            "Create Comment Too Long",
            "POST",
            f"posts/{self.university_post_id}/comments",
            400,
            data={"content": long_content}
        )

    def test_create_comment_valid(self):
        """Test creating a valid comment"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Create Comment Valid", False, "No auth token or post ID available")
            return False, {}
            
        success, response = self.run_test(
            "Create Comment Valid",
            "POST",
            f"posts/{self.university_post_id}/comments",
            200,
            data={"content": "Test comment content"}
        )
        
        if success and 'id' in response:
            self.comment_id = response['id']
            return True, response
        
        return success, response

    def test_get_comments(self):
        """Test getting comments for a post"""
        if not self.token or not hasattr(self, 'university_post_id'):
            self.log_test("Get Comments", False, "No auth token or post ID available")
            return False, {}
            
        return self.run_test("Get Comments", "GET", f"posts/{self.university_post_id}/comments", 200)

    def test_vote_comment_upvote(self):
        """Test upvoting a comment"""
        if not self.token or not hasattr(self, 'comment_id'):
            self.log_test("Vote Comment Upvote", False, "No auth token or comment ID available")
            return False, {}
            
        return self.run_test(
            "Vote Comment Upvote",
            "POST",
            f"comments/{self.comment_id}/vote",
            200,
            data={"vote": 1}
        )

    def test_vote_comment_downvote(self):
        """Test downvoting a comment"""
        if not self.token or not hasattr(self, 'comment_id'):
            self.log_test("Vote Comment Downvote", False, "No auth token or comment ID available")
            return False, {}
            
        return self.run_test(
            "Vote Comment Downvote",
            "POST",
            f"comments/{self.comment_id}/vote",
            200,
            data={"vote": -1}
        )

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, _ = self.run_test("Unauthorized Access", "GET", "posts", 401)
        
        # Restore token
        self.token = temp_token
        return success, {}

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting NearbyTalk API Tests")
        print("=" * 50)
        
        # Health check
        self.test_health_check()
        
        # Auth tests
        self.test_register_invalid_email()
        self.test_register_valid_user()
        self.test_verify_email_invalid_code()
        self.test_verify_email_valid_code()
        self.test_login_invalid_credentials()
        self.test_login_valid_credentials()
        self.test_get_me()
        
        # Post tests
        self.test_create_post_empty_content()
        self.test_create_post_too_long()
        self.test_create_university_post()
        self.test_create_city_post()
        self.test_get_university_posts()
        self.test_get_city_posts()
        self.test_get_hot_posts()
        self.test_get_single_post()
        
        # Vote tests
        self.test_vote_post_upvote()
        self.test_vote_post_downvote()
        self.test_vote_post_remove()
        
        # Comment tests
        self.test_create_comment_empty()
        self.test_create_comment_too_long()
        self.test_create_comment_valid()
        self.test_get_comments()
        self.test_vote_comment_upvote()
        self.test_vote_comment_downvote()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    tester = NearbyTalkAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())